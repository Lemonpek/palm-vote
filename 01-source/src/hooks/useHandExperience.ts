import { useCallback, useEffect, useRef, useState } from 'react';
import { CaptureError, CaptureManager } from '../capture/CaptureManager';
import { HAND_CONFIG } from '../config';
import type { AppCopy } from '../i18n';
import { PaddleRenderer } from '../render/PaddleRenderer';
import { HandTracker } from '../tracking/HandTracker';
import type { AppError, ExperienceStatus, InputSource } from '../types';
import { BrowserHandDetector, SCREEN_REGIONS } from '../vision/HandDetector';

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mirror: boolean;
  debug: boolean;
  debugCopy: AppCopy['debug'];
};

export function useHandExperience({ videoRef, canvasRef, mirror, debug, debugCopy }: Options) {
  const captureRef = useRef(new CaptureManager());
  const detectorRef = useRef(new BrowserHandDetector());
  const trackerRef = useRef(new HandTracker());
  const rendererRef = useRef(new PaddleRenderer());
  const frameRef = useRef<number | null>(null);
  const runTokenRef = useRef(0);
  const lastInferenceRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const scanIndexRef = useRef(0);
  const scanRegionRef = useRef(SCREEN_REGIONS[0]);
  const mirrorRef = useRef(mirror);
  const debugRef = useRef(debug);
  const debugCopyRef = useRef(debugCopy);
  const lastUiUpdateRef = useRef(0);
  const [source, setSource] = useState<InputSource>('screen');
  const [status, setStatus] = useState<ExperienceStatus>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [handCount, setHandCount] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => { mirrorRef.current = mirror; }, [mirror]);
  useEffect(() => { debugRef.current = debug; }, [debug]);
  useEffect(() => { debugCopyRef.current = debugCopy; }, [debugCopy]);

  const refreshDevices = useCallback(async () => {
    try {
      const next = await captureRef.current.listCameras();
      setDevices(next);
      setSelectedDeviceId((current) => current || next[0]?.deviceId || '');
    } catch {
      setDevices([]);
    }
  }, []);

  const stop = useCallback(() => {
    runTokenRef.current += 1;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    captureRef.current.stop();
    trackerRef.current.reset();
    rendererRef.current.reset();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setHandCount(0);
    setFps(0);
    setStatus('stopped');
  }, [videoRef]);

  const start = useCallback(async (requestedDeviceId = selectedDeviceId) => {
    const token = ++runTokenRef.current;
    const activeSource = source;
    setError(null);
    setStatus('requesting');
    trackerRef.current.reset();
    rendererRef.current.reset();
    scanIndexRef.current = 0;
    try {
      const stream = await captureRef.current.start({
        source: activeSource,
        deviceId: activeSource === 'camera' ? requestedDeviceId || undefined : undefined,
      });
      if (token !== runTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) throw new Error('video-unavailable');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      const activeTrack = stream.getVideoTracks()[0];
      activeTrack.addEventListener('ended', () => {
        if (token !== runTokenRef.current) return;
        stop();
        setStatus('error');
        setError({ code: activeSource === 'screen' ? 'share-ended' : 'disconnected' });
      }, { once: true });
      if (activeSource === 'camera') {
        const actualDeviceId = activeTrack.getSettings().deviceId;
        if (actualDeviceId) setSelectedDeviceId(actualDeviceId);
        await refreshDevices();
      }
      setStatus('loading-model');
      try {
        await detectorRef.current.initialize();
      } catch {
        throw Object.assign(new Error('model-load'), { appError: { code: 'model-load' } satisfies AppError });
      }
      if (token !== runTokenRef.current) return;
      setStatus('running');
      lastInferenceRef.current = 0;
      lastVideoTimeRef.current = -1;
      let frameCounter = 0;
      let fpsWindowStart = performance.now();

      const loop = (now: number) => {
        if (token !== runTokenRef.current) return;
        const canvas = canvasRef.current;
        const currentVideo = videoRef.current;
        if (!canvas || !currentVideo) return;
        if (
          currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          && now - lastInferenceRef.current >= HAND_CONFIG.inferenceIntervalMs
          && currentVideo.currentTime !== lastVideoTimeRef.current
        ) {
          const region = activeSource === 'screen' ? SCREEN_REGIONS[scanIndexRef.current % SCREEN_REGIONS.length] : undefined;
          if (region) {
            scanRegionRef.current = region;
            scanIndexRef.current += 1;
          }
          const detections = detectorRef.current.detect(currentVideo, now, region);
          trackerRef.current.update(detections, now, region);
          lastInferenceRef.current = now;
          lastVideoTimeRef.current = currentVideo.currentTime;
          frameCounter += 1;
        }
        const tracks = trackerRef.current.getTracks(now);
        rendererRef.current.draw(
          canvas,
          currentVideo,
          tracks,
          now,
          mirrorRef.current,
          debugRef.current,
          debugCopyRef.current,
          activeSource === 'screen' ? scanRegionRef.current : undefined,
        );
        if (now - lastUiUpdateRef.current > 180) {
          setHandCount(tracks.filter((track) =>
            track.lastTrustedOrientationAt > 0
            && now - track.lastSeenAt < 240
            && now - track.lastTrustedOrientationAt <= HAND_CONFIG.lowConfidenceHideMs,
          ).length);
          lastUiUpdateRef.current = now;
        }
        if (now - fpsWindowStart >= 1000) {
          setFps(Math.round((frameCounter * 1000) / (now - fpsWindowStart)));
          frameCounter = 0;
          fpsWindowStart = now;
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch (caught) {
      captureRef.current.stop();
      if (token !== runTokenRef.current) return;
      setStatus('error');
      if (caught instanceof CaptureError) setError(caught.info);
      else setError((caught as { appError?: AppError })?.appError ?? { code: 'start-failed' });
    }
  }, [canvasRef, refreshDevices, selectedDeviceId, source, stop, videoRef]);

  const selectSource = useCallback((next: InputSource) => {
    if (next === source) return;
    stop();
    setError(null);
    setSource(next);
  }, [source, stop]);

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (source === 'camera' && status === 'running') await start(deviceId);
  }, [source, start, status]);

  useEffect(() => {
    void refreshDevices();
    // Warm the local model while the user chooses a source so first detection
    // does not pay the model download/initialization cost.
    void detectorRef.current.initialize().catch(() => undefined);
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
      runTokenRef.current += 1;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      captureRef.current.stop();
      detectorRef.current.close();
    };
  }, [refreshDevices]);

  return {
    source, status, error, devices, selectedDeviceId, handCount, fps,
    start, stop, selectSource, selectDevice, refreshDevices,
  };
}
