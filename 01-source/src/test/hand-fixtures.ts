import type { HandDetection, HandSide, Point3D } from '../types';

export function makeOpenHand(
  centerX: number,
  front = true,
  handedness: HandSide = 'Right',
): HandDetection {
  const points: Point3D[] = Array.from({ length: 21 }, () => ({ x: centerX, y: 0.55, z: 0 }));
  const rightFront = (handedness === 'Right') === front;
  const indexX = centerX + (rightFront ? -0.08 : 0.08);
  const pinkyX = centerX + (rightFront ? 0.08 : -0.08);
  points[0] = { x: centerX, y: 0.78, z: 0 };
  points[5] = { x: indexX, y: 0.56, z: 0 };
  points[9] = { x: centerX - (rightFront ? 0.02 : -0.02), y: 0.53, z: 0 };
  points[13] = { x: centerX + (rightFront ? 0.03 : -0.03), y: 0.56, z: 0 };
  points[17] = { x: pinkyX, y: 0.59, z: 0 };
  const xs = [indexX, centerX, centerX + (rightFront ? 0.04 : -0.04), pinkyX];
  const pips = [6, 10, 14, 18];
  const dips = [7, 11, 15, 19];
  const tips = [8, 12, 16, 20];
  pips.forEach((id, index) => { points[id] = { x: xs[index], y: 0.43, z: 0 }; });
  dips.forEach((id, index) => { points[id] = { x: xs[index], y: 0.33 + index * 0.006, z: 0 }; });
  tips.forEach((id, index) => { points[id] = { x: xs[index], y: 0.23 + index * 0.012, z: 0 }; });
  points[1] = { x: centerX - 0.05, y: 0.68, z: 0 };
  points[2] = { x: centerX - 0.10, y: 0.61, z: 0 };
  points[3] = { x: centerX - 0.14, y: 0.55, z: 0 };
  points[4] = { x: centerX - 0.18, y: 0.49, z: 0 };
  return { landmarks: points, handedness, handednessScore: 0.98 };
}

export function makeFist(
  centerX: number,
  front = true,
  handedness: HandSide = 'Right',
  curledFingers = 4,
): HandDetection {
  const detection = makeOpenHand(centerX, front, handedness);
  const fingers = [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
  fingers.forEach(([mcp, pip, dip, tip], index) => {
    if (index >= curledFingers) return;
    const x = detection.landmarks[mcp].x;
    detection.landmarks[pip] = { x, y: 0.47, z: 0 };
    detection.landmarks[dip] = { x, y: 0.51, z: front ? -0.015 : 0.015 };
    detection.landmarks[tip] = { x, y: 0.49, z: front ? -0.035 : 0.035 };
  });
  return detection;
}
