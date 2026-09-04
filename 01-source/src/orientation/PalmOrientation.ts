import type { HandDetection, OrientationReading, Point3D } from '../types';

const WRIST = 0;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;
const FINGER_TIPS = [8, 12, 16, 20];
const FINGER_PIPS = [6, 10, 14, 18];
const FINGER_MCPS = [5, 9, 13, 17];

function distance(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function inFrame(point: Point3D): boolean {
  return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}

export function palmCenter(landmarks: Point3D[]): Point3D {
  const ids = [WRIST, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP];
  const visibleIds = ids.filter((id) => inFrame(landmarks[id]));
  const centerIds = visibleIds.length >= 3 ? visibleIds : ids;
  return centerIds.reduce(
    (sum, id) => ({
      x: sum.x + landmarks[id].x / centerIds.length,
      y: sum.y + landmarks[id].y / centerIds.length,
      z: sum.z + landmarks[id].z / centerIds.length,
    }),
    { x: 0, y: 0, z: 0 },
  );
}

export function palmScale(landmarks: Point3D[]): number {
  const visibleMcps = FINGER_MCPS.filter((id) => inFrame(landmarks[id]));
  let scale = distance(landmarks[INDEX_MCP], landmarks[PINKY_MCP]);
  if (visibleMcps.length >= 2) {
    scale = 0;
    for (let i = 0; i < visibleMcps.length; i += 1) {
      for (let j = i + 1; j < visibleMcps.length; j += 1) {
        scale = Math.max(scale, distance(landmarks[visibleMcps[i]], landmarks[visibleMcps[j]]));
      }
    }
  }
  return Math.max(0.025, scale);
}

function openPalmConfidence(landmarks: Point3D[]): number {
  const wrist = landmarks[WRIST];
  const scale = palmScale(landmarks);
  const visibleFingers = FINGER_TIPS
    .map((tip, index) => ({ tip, pip: FINGER_PIPS[index], mcp: FINGER_MCPS[index] }))
    .filter(({ tip, pip, mcp }) => inFrame(landmarks[tip]) && inFrame(landmarks[pip]) && inFrame(landmarks[mcp]));
  // Two clearly visible extended fingers plus the knuckle line are enough to
  // classify a cropped palm; fewer visible fingers are too ambiguous.
  if (visibleFingers.length < 2) return 0;
  let extended = 0;
  let reach = 0;
  for (const { tip, pip } of visibleFingers) {
    const tipDistance = distance(landmarks[tip], wrist);
    const pipDistance = distance(landmarks[pip], wrist);
    if (tipDistance > pipDistance * 1.08) extended += 1;
    reach += tipDistance / scale;
  }
  const extensionScore = extended / visibleFingers.length;
  const reachScore = Math.min(1, Math.max(0, (reach / visibleFingers.length - 1.45) / 1.2));
  const evidenceWeight = visibleFingers.length === 2 ? 0.78 : visibleFingers.length === 3 ? 0.92 : 1;
  return (extensionScore * 0.65 + reachScore * 0.35) * evidenceWeight;
}

export function readPalmOrientation(detection: HandDetection): OrientationReading {
  const { landmarks, handedness } = detection;
  if (landmarks.length < 21 || handedness === 'Unknown') {
    return { label: 'side', score: 0, confidence: 0 };
  }

  const wrist = landmarks[WRIST];
  const visibleMcps = FINGER_MCPS.filter((id) => inFrame(landmarks[id]));
  if (visibleMcps.length < 2) return { label: 'side', score: 0, confidence: 0 };
  const index = landmarks[inFrame(landmarks[INDEX_MCP]) ? INDEX_MCP : visibleMcps[0]];
  const pinky = landmarks[inFrame(landmarks[PINKY_MCP]) ? PINKY_MCP : visibleMcps[visibleMcps.length - 1]];
  const ax = index.x - wrist.x;
  const ay = index.y - wrist.y;
  const bx = pinky.x - wrist.x;
  const by = pinky.y - wrist.y;
  const denominator = Math.max(1e-6, Math.hypot(ax, ay) * Math.hypot(bx, by));
  const winding = (ax * by - ay * bx) / denominator;
  const handednessSign = handedness === 'Right' ? 1 : -1;
  const score = winding * handednessSign;
  const confidence = Math.min(1, Math.abs(score) * 1.55) * openPalmConfidence(landmarks) * detection.handednessScore;

  return {
    label: confidence < 0.2 ? 'side' : score >= 0 ? 'palm' : 'back',
    score,
    confidence,
  };
}
