import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HAND_CONFIG } from '../config';
import type { DetectionRegion, HandDetection, HandSide, Point3D } from '../types';

const REGION_SIZE = (1 + HAND_CONFIG.screenRegionOverlap) / 2;
const REGION_OFFSET = 1 - REGION_SIZE;
export const SCREEN_REGIONS: DetectionRegion[] = [
  { x: 0, y: 0, width: REGION_SIZE, height: REGION_SIZE },
  { x: REGION_OFFSET, y: 0, width: REGION_SIZE, height: REGION_SIZE },
  { x: 0, y: REGION_OFFSET, width: REGION_SIZE, height: REGION_SIZE },
  { x: REGION_OFFSET, y: REGION_OFFSET, width: REGION_SIZE, height: REGION_SIZE },
];

export function mapRegionPoint(point: Point3D, region?: DetectionRegion): Point3D {
  return region
    ? { x: region.x + point.x * region.width, y: region.y + point.y * region.height, z: point.z * region.width }
    : { ...point };
}

function physicalHandedness(categoryName?: string): HandSide {
  // Hand Landmarker labels assume a mirrored selfie image; inference uses the raw frame.
  if (categoryName === 'Left') return 'Right';
  if (categoryName === 'Right') return 'Left';
  return 'Unknown';
}

export class BrowserHandDetector {
  private landmarker: HandLandmarker | null = null;
  private initializing: Promise<void> | null = null;
  private cropCanvas = document.createElement('canvas');

  async initialize(): Promise<void> {
    if (this.landmarker) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      const vision = await FilesetResolver.forVisionTasks('/wasm');
      const options = {
        baseOptions: { modelAssetPath: '/models/hand_landmarker.task', delegate: 'GPU' as const },
        runningMode: 'VIDEO' as const,
        numHands: HAND_CONFIG.maxHands,
        minHandDetectionConfidence: HAND_CONFIG.minDetectionConfidence,
        minHandPresenceConfidence: HAND_CONFIG.minPresenceConfidence,
        minTrackingConfidence: HAND_CONFIG.minTrackingConfidence,
      };
      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, options);
      } catch {
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: 'CPU' },
        });
      }
    })();

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  detect(video: HTMLVideoElement, timestampMs: number, region?: DetectionRegion): HandDetection[] {
    if (!this.landmarker) return [];
    let source: HTMLVideoElement | HTMLCanvasElement = video;
    if (region) {
      const width = Math.max(1, Math.round(video.videoWidth * region.width));
      const height = Math.max(1, Math.round(video.videoHeight * region.height));
      if (this.cropCanvas.width !== width) this.cropCanvas.width = width;
      if (this.cropCanvas.height !== height) this.cropCanvas.height = height;
      const context = this.cropCanvas.getContext('2d');
      if (!context) return [];
      context.drawImage(
        video,
        video.videoWidth * region.x,
        video.videoHeight * region.y,
        video.videoWidth * region.width,
        video.videoHeight * region.height,
        0,
        0,
        width,
        height,
      );
      source = this.cropCanvas;
    }
    const result = this.landmarker.detectForVideo(source, timestampMs);
    return result.landmarks.map((landmarks, index) => {
      const category = result.handedness[index]?.[0];
      return {
        landmarks: landmarks.map((point) => mapRegionPoint(point, region)),
        worldLandmarks: result.worldLandmarks[index]?.map(({ x, y, z }) => ({ x, y, z })),
        handedness: physicalHandedness(category?.categoryName),
        handednessScore: category?.score ?? 0,
      };
    });
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
