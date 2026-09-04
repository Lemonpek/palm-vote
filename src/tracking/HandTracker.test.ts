import { describe, expect, it } from 'vitest';
import { HandTracker } from './HandTracker';
import { makeFist, makeOpenHand } from '../test/hand-fixtures';

describe('HandTracker', () => {
  it('debounces orientation changes independently per track', () => {
    const tracker = new HandTracker();
    const first = makeOpenHand(0.3, true, 'Right');
    const second = makeOpenHand(0.72, true, 'Left');
    for (const time of [0, 40, 80, 120, 160, 200]) tracker.update([first, second], time);
    let tracks = tracker.getTracks(200).sort((a, b) => a.center.x - b.center.x);
    expect(tracks.map((track) => track.state)).toEqual(['yes', 'yes']);
    const stableIds = tracks.map((track) => track.id);

    for (const time of [240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640]) {
      tracker.update([makeOpenHand(0.31, false, 'Right'), second], time);
    }
    tracks = tracker.getTracks(640).sort((a, b) => a.center.x - b.center.x);
    expect(tracks.map((track) => track.id)).toEqual(stableIds);
    expect(tracks.map((track) => track.state)).toEqual(['no', 'yes']);
  });

  it('retains an ID through a short occlusion', () => {
    const tracker = new HandTracker();
    const hand = makeOpenHand(0.45, true, 'Right');
    const [initial] = tracker.update([hand], 0);
    expect(tracker.update([], 300)[0].id).toBe(initial.id);
    const [restored] = tracker.update([makeOpenHand(0.47, true, 'Right')], 520);
    expect(restored.id).toBe(initial.id);
  });

  it('does not mark tracks outside the scanned screen region as missing', () => {
    const tracker = new HandTracker();
    const [initial] = tracker.update([makeOpenHand(0.2, true, 'Right')], 0);
    tracker.update([], 300, { x: 0.46, y: 0, width: 0.54, height: 0.54 });
    const [retained] = tracker.getTracks(300);
    expect(retained.id).toBe(initial.id);
    expect(retained.missingSince).toBeNull();
  });

  it('does not trust a fist and caps tracks at twenty-four', () => {
    const tracker = new HandTracker();
    for (const time of [0, 80, 160, 240, 320]) tracker.update([makeFist(0.2, true, 'Right')], time);
    expect(tracker.getTracks(320)[0].lastTrustedOrientationAt).toBe(0);

    tracker.reset();
    tracker.update(Array.from({ length: 30 }, (_, index) => makeOpenHand(0.05 + index * 0.03, true, index % 2 ? 'Left' : 'Right')), 0);
    expect(tracker.getTracks(0)).toHaveLength(24);
  });
});
