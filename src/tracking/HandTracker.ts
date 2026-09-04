import { HAND_CONFIG } from '../config';
import { palmCenter, palmScale, readPalmOrientation } from '../orientation/PalmOrientation';
import type { DetectionRegion, HandDetection, OrientationLabel, Point3D, TrackedHand } from '../types';

type InternalTrack = TrackedHand & {
  candidate: Exclude<OrientationLabel, 'side'> | null;
  candidateFrames: number;
  candidateSince: number;
};

const lerp = (a: number, b: number, alpha: number) => a + (b - a) * alpha;
const lerpPoint = (a: Point3D, b: Point3D, alpha: number): Point3D => ({
  x: lerp(a.x, b.x, alpha),
  y: lerp(a.y, b.y, alpha),
  z: lerp(a.z, b.z, alpha),
});

export class HandTracker {
  private tracks = new Map<number, InternalTrack>();
  private nextId = 1;

  update(detections: HandDetection[], now: number, observedRegion?: DetectionRegion): TrackedHand[] {
    this.removeExpired(now);
    const trackList = [...this.tracks.values()];
    const detectionMeta = detections.map((detection) => ({
      detection,
      center: palmCenter(detection.landmarks),
      scale: palmScale(detection.landmarks),
    }));

    const candidates: Array<{ track: InternalTrack; detectionIndex: number; cost: number }> = [];
    for (const track of trackList) {
      const elapsed = Math.min(0.25, Math.max(0, (now - track.lastSeenAt) / 1000));
      const predicted = {
        x: track.center.x + track.velocity.x * elapsed,
        y: track.center.y + track.velocity.y * elapsed,
        z: track.center.z,
      };
      detectionMeta.forEach(({ detection, center, scale }, detectionIndex) => {
        const distance = Math.hypot(center.x - predicted.x, center.y - predicted.y);
        const allowed = Math.max(HAND_CONFIG.trackMaxDistance, track.scale * 2.2);
        if (distance > allowed) return;
        const handPenalty =
          track.handedness !== 'Unknown' &&
          detection.handedness !== 'Unknown' &&
          track.handedness !== detection.handedness
            ? 0.09
            : 0;
        const scalePenalty = Math.min(0.08, Math.abs(Math.log(scale / track.scale)) * 0.035);
        candidates.push({ track, detectionIndex, cost: distance + handPenalty + scalePenalty });
      });
    }

    candidates.sort((a, b) => a.cost - b.cost);
    const matchedTracks = new Set<number>();
    const matchedDetections = new Set<number>();
    for (const candidate of candidates) {
      if (matchedTracks.has(candidate.track.id) || matchedDetections.has(candidate.detectionIndex)) continue;
      this.updateTrack(candidate.track, detectionMeta[candidate.detectionIndex].detection, now);
      matchedTracks.add(candidate.track.id);
      matchedDetections.add(candidate.detectionIndex);
    }

    for (const track of trackList) {
      if (!matchedTracks.has(track.id) && this.isObserved(track, observedRegion) && track.missingSince === null) {
        track.missingSince = now;
      }
    }
    detectionMeta.forEach(({ detection }, index) => {
      if (!matchedDetections.has(index) && this.tracks.size < HAND_CONFIG.maxHands) this.createTrack(detection, now);
    });

    return this.getTracks(now);
  }

  getTracks(now: number): TrackedHand[] {
    return [...this.tracks.values()].filter(
      (track) => now - track.lastSeenAt <= HAND_CONFIG.occlusionHoldMs,
    );
  }

  reset(): void {
    this.tracks.clear();
    this.nextId = 1;
  }

  private createTrack(detection: HandDetection, now: number): void {
    const orientation = readPalmOrientation(detection);
    const center = palmCenter(detection.landmarks);
    const track: InternalTrack = {
      id: this.nextId++,
      landmarks: detection.landmarks.map((point) => ({ ...point })),
      handedness: detection.handedness,
      handednessScore: detection.handednessScore,
      center,
      velocity: { x: 0, y: 0, z: 0 },
      scale: palmScale(detection.landmarks),
      state: orientation.label === 'back' ? 'no' : 'yes',
      orientation,
      lastTrustedOrientationAt: 0,
      firstSeenAt: now,
      lastSeenAt: now,
      missingSince: null,
      visible: true,
      candidate: null,
      candidateFrames: 0,
      candidateSince: now,
    };
    this.applyOrientation(track, orientation.label, orientation.confidence, now);
    this.tracks.set(track.id, track);
  }

  private updateTrack(track: InternalTrack, detection: HandDetection, now: number): void {
    const dt = Math.max(0.016, (now - track.lastSeenAt) / 1000);
    const rawCenter = palmCenter(detection.landmarks);
    const previousCenter = track.center;
    const smoothedCenter = lerpPoint(previousCenter, rawCenter, HAND_CONFIG.smoothingAlpha);
    track.velocity = {
      x: lerp(track.velocity.x, (smoothedCenter.x - previousCenter.x) / dt, 0.3),
      y: lerp(track.velocity.y, (smoothedCenter.y - previousCenter.y) / dt, 0.3),
      z: 0,
    };
    track.center = smoothedCenter;
    track.scale = lerp(track.scale, palmScale(detection.landmarks), HAND_CONFIG.smoothingAlpha);
    track.landmarks = detection.landmarks.map((point, index) =>
      lerpPoint(track.landmarks[index] ?? point, point, HAND_CONFIG.smoothingAlpha),
    );
    track.handedness = detection.handedness;
    track.handednessScore = detection.handednessScore;
    track.orientation = readPalmOrientation({ ...detection, landmarks: track.landmarks });
    track.lastSeenAt = now;
    track.missingSince = null;
    track.visible = true;
    this.applyOrientation(track, track.orientation.label, track.orientation.confidence, now);
  }

  private applyOrientation(
    track: InternalTrack,
    label: OrientationLabel,
    confidence: number,
    now: number,
  ): void {
    if (label === 'side' || confidence < HAND_CONFIG.orientationConfidence) {
      track.candidate = null;
      track.candidateFrames = 0;
      return;
    }

    if (track.candidate !== label) {
      track.candidate = label;
      track.candidateFrames = 1;
      track.candidateSince = now;
      return;
    }

    track.candidateFrames += 1;
    if (
      track.candidateFrames >= HAND_CONFIG.orientationStableFrames &&
      now - track.candidateSince >= HAND_CONFIG.orientationStableMs
    ) {
      track.state = label === 'palm' ? 'yes' : 'no';
      track.lastTrustedOrientationAt = now;
    }
  }

  private removeExpired(now: number): void {
    for (const [id, track] of this.tracks) {
      if (now - track.lastSeenAt > HAND_CONFIG.trackMaxAgeMs) this.tracks.delete(id);
    }
  }

  private isObserved(track: InternalTrack, region?: DetectionRegion): boolean {
    if (!region) return true;
    const margin = Math.max(0.02, track.scale * 0.6);
    return track.center.x >= region.x - margin
      && track.center.x <= region.x + region.width + margin
      && track.center.y >= region.y - margin
      && track.center.y <= region.y + region.height + margin;
  }
}
