import type { AppError, CaptureRequest } from '../types';

export class CaptureError extends Error {
  readonly info: AppError;

  constructor(info: AppError) {
    super(info.code);
    this.name = 'CaptureError';
    this.info = info;
  }
}

function cameraError(error: unknown): CaptureError {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return new CaptureError({ code: 'permission-denied' });
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return new CaptureError({ code: 'not-found' });
  if (name === 'NotReadableError' || name === 'TrackStartError') return new CaptureError({ code: 'not-readable' });
  if (name === 'OverconstrainedError') return new CaptureError({ code: 'overconstrained' });
  return new CaptureError({ code: 'start-failed' });
}

export class CaptureManager {
  private stream: MediaStream | null = null;

  async listCameras(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  }

  async start(request: CaptureRequest): Promise<MediaStream> {
    this.stop();
    if (request.source === 'screen') return this.startScreen();
    return this.startCamera(request.deviceId);
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private async startScreen(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new CaptureError({ code: 'screen-unsupported' });
    try {
      const options: DisplayMediaStreamOptions & {
        selfBrowserSurface?: 'exclude';
        surfaceSwitching?: 'include';
        systemAudio?: 'exclude';
      } = {
        audio: false,
        video: { frameRate: { ideal: 30, max: 60 } },
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        systemAudio: 'exclude',
      };
      this.stream = await navigator.mediaDevices.getDisplayMedia(options);
      const track = this.stream.getVideoTracks()[0];
      if (track) track.contentHint = 'motion';
      return this.stream;
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
        throw new CaptureError({ code: 'share-not-granted' });
      }
      throw new CaptureError({ code: 'start-failed' });
    }
  }

  private async startCamera(deviceId?: string): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) throw new CaptureError({ code: 'unsupported' });
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 }, facingMode: 'user' },
      });
      return this.stream;
    } catch (error) {
      throw cameraError(error);
    }
  }
}
