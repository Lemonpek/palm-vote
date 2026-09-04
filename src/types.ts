export type Point3D = { x: number; y: number; z: number };
export type HandSide = 'Left' | 'Right' | 'Unknown';
export type PaddleState = 'yes' | 'no';
export type OrientationLabel = 'palm' | 'back' | 'side';
export type InputSource = 'screen' | 'camera';
export type CaptureRequest = { source: InputSource; deviceId?: string };
export type DetectionRegion = { x: number; y: number; width: number; height: number };

export type HandDetection = {
  landmarks: Point3D[];
  worldLandmarks?: Point3D[];
  handedness: HandSide;
  handednessScore: number;
};

export type OrientationReading = {
  label: OrientationLabel;
  score: number;
  confidence: number;
};

export type TrackedHand = {
  id: number;
  landmarks: Point3D[];
  handedness: HandSide;
  handednessScore: number;
  center: Point3D;
  velocity: Point3D;
  scale: number;
  state: PaddleState;
  orientation: OrientationReading;
  lastTrustedOrientationAt: number;
  firstSeenAt: number;
  lastSeenAt: number;
  missingSince: number | null;
  visible: boolean;
};

export type ExperienceStatus =
  | 'idle'
  | 'requesting'
  | 'loading-model'
  | 'running'
  | 'stopped'
  | 'error';

export type AppErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'not-readable'
  | 'overconstrained'
  | 'unsupported'
  | 'model-load'
  | 'disconnected'
  | 'screen-unsupported'
  | 'share-not-granted'
  | 'share-ended'
  | 'start-failed';

export type AppError = { code: AppErrorCode };
