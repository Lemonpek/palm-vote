import { describe, expect, it } from 'vitest';
import { mapRegionPoint, SCREEN_REGIONS } from './HandDetector';

describe('screen region mapping', () => {
  it('covers the full frame with a twelve-percent overlap', () => {
    expect(SCREEN_REGIONS).toHaveLength(4);
    expect(SCREEN_REGIONS[0].width).toBeCloseTo(0.56);
    expect(SCREEN_REGIONS[1].x).toBeCloseTo(0.44);
  });

  it('maps crop-local landmarks back to the full frame', () => {
    const point = mapRegionPoint({ x: 0.5, y: 0.25, z: -0.1 }, SCREEN_REGIONS[1]);
    expect(point.x).toBeCloseTo(0.72);
    expect(point.y).toBeCloseTo(0.14);
    expect(point.z).toBeCloseTo(-0.056);
  });
});
