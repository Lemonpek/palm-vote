import { describe, expect, it } from 'vitest';
import { readPalmOrientation } from './PalmOrientation';
import { makeFist, makeOpenHand } from '../test/hand-fixtures';

describe('readPalmOrientation', () => {
  it('normalizes palm/back winding for right and left hands', () => {
    for (const hand of ['Right', 'Left'] as const) {
      const palm = readPalmOrientation(makeOpenHand(0.5, true, hand));
      const back = readPalmOrientation(makeOpenHand(0.5, false, hand));
      expect(palm.label).toBe('palm');
      expect(back.label).toBe('back');
      expect(palm.confidence).toBeGreaterThan(0.42);
      expect(back.confidence).toBeGreaterThan(0.42);
    }
  });

  it('does not trust a closed fist as an open palm', () => {
    expect(readPalmOrientation(makeFist(0.5, true, 'Right')).confidence).toBeLessThan(0.42);
  });

  it('accepts a cropped palm when two extended fingers and knuckles remain visible', () => {
    const hand = makeOpenHand(0.5, true, 'Right');
    hand.landmarks[16] = { ...hand.landmarks[16], x: 1.08 };
    hand.landmarks[20] = { ...hand.landmarks[20], x: 1.08 };
    expect(readPalmOrientation(hand).label).toBe('palm');
    expect(readPalmOrientation(hand).confidence).toBeGreaterThan(0.42);
  });

  it('refuses to guess when handedness is unknown', () => {
    const result = readPalmOrientation(makeOpenHand(0.5, true, 'Unknown'));
    expect(result.label).toBe('side');
    expect(result.confidence).toBe(0);
  });
});
