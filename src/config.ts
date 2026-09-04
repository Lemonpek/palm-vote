export const HAND_CONFIG = {
  maxHands: 24,
  minDetectionConfidence: 0.46,
  minPresenceConfidence: 0.48,
  minTrackingConfidence: 0.45,
  inferenceIntervalMs: 25,
  smoothingAlpha: 0.36,
  orientationConfidence: 0.42,
  orientationStableFrames: 3,
  orientationStableMs: 100,
  lowConfidenceHideMs: 900,
  occlusionHoldMs: 650,
  trackMaxDistance: 0.22,
  trackMaxAgeMs: 1400,
  screenRegionOverlap: 0.12,
} as const;

export type HandConfig = typeof HAND_CONFIG;
