# Palm Vote

A real-time interactive web app for desktop browsers. Raise an open hand with your palm facing the video to show a green **✓**. Flip your hand so the back faces the video to show a red **✕**. Video frames are processed locally in device memory.

The interface supports English and Simplified Chinese. On your first visit, Chinese browser languages select Chinese; other browser languages select English. Use the language button in the header to switch. Your choice is remembered locally. The **Instructions** button opens an English visual guide.

## Run locally

Install pnpm and a compatible Node.js version: Node.js 20.19+ within the 20.x series, or Node.js 22.12 or later, as required by Vite 8.

Run these commands from the repository root:

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:4173`. To run the tests and create a production build:

```bash
pnpm test
pnpm build
```

The production output is written to `dist/`. Use the latest Chrome or Microsoft Edge. Camera and screen capture require localhost, 127.0.0.1, or HTTPS.

## Use with Teams

1. Ask participants to turn on their Teams cameras and raise an open hand: palm facing the camera for **✓**, back of the hand for **✕**.
2. In Palm Vote, select **Teams screen/window**, then click **Choose Teams window**.
3. Select the Teams window in the browser's sharing picker. Avoid selecting the Palm Vote window itself.
4. Keep the Teams window visible and not minimized.
5. To let everyone see the results, share the processed Palm Vote browser window in Teams.

Use separate windows or two displays: one shows the Teams gallery, and the other shows and shares the processed results. The browser requires you to select the capture source each time you start screen recognition.

For a directly connected camera, select **Local camera**, choose a camera device, and click **Start camera**. Use **Mirror** to adjust the preview and **Stop recognition** to release the video source.

## Project structure

```text
src/
├─ capture/CaptureManager.ts       # Screen/camera streams, permissions, and cleanup
├─ vision/HandDetector.ts          # MediaPipe detection, region scanning, coordinate mapping
├─ orientation/PalmOrientation.ts # Open-hand confidence and palm/back classification
├─ tracking/HandTracker.ts         # Up to 24 hand IDs, independent states, smoothing, occlusion
├─ render/PaddleRenderer.ts        # Video, virtual paddles, and debug overlay
├─ hooks/useHandExperience.ts      # Real-time detection loop and UI state
├─ components/                    # Bilingual interface components
├─ config.ts                      # Detection and tracking parameters
└─ *.test.ts                      # Orientation, tracking, region, and language tests
public/
├─ assets/                        # English instruction poster
├─ models/                        # Hand Landmarker model
└─ wasm/                          # MediaPipe WebAssembly runtime
```

The model and WebAssembly runtime are served from `public/`; no external model CDN is required. Keep `src/`, `public/`, `package.json`, and `index.html` directly in the repository root. If uploading in batches, upload the contents of each batch folder rather than the numbered wrapper folders.

## Technology and privacy

- React 19 and Vite 8: interface and build tooling; MIT licenses.
- MediaPipe Tasks Vision 1.0.1 and Hand Landmarker: 21-point hand landmarks; Apache-2.0 licenses.
- Screen Capture API and Camera API: access to the window or camera explicitly selected by the user.
- Canvas 2D: video rendering, virtual paddles, animations, and optional debugging information.

Palm Vote does not upload, save, take screenshots of, or record captured video. It does not capture shared audio or perform face recognition, identity detection, or participant identification. Video tracks are released when recognition stops, sharing ends, or the page closes. If you share the processed window in Teams, that sharing is handled by Teams.

## Palm orientation and flipping

The algorithm computes a normalized signed area from the wrist, index-finger base joint (MCP), and little-finger MCP. MediaPipe's left/right hand classification normalizes the sign. When a base joint is outside the frame, the algorithm uses the outermost visible finger base joints where sufficient evidence remains.

Open-hand confidence is based on finger extension and fingertip distance from the wrist. With a fully visible hand, the algorithm evaluates all four non-thumb fingers. A cropped hand may still be classified if at least two extended fingers and their base and middle (PIP) joints remain visible. Insufficient evidence produces an uncertain result.

- Positive normalized sign with sufficient open-hand confidence: **palm**, showing **✓**.
- Negative normalized sign with sufficient open-hand confidence: **back of hand**, showing **✕**.

A new orientation must reach at least 0.42 confidence, remain consistent for 3 observations, and last at least 100 ms before switching. Side-on, closed, or low-confidence hands retain the last trusted state temporarily; the paddle is hidden after 900 ms without a trusted orientation.

## Multiple people and meeting-room video

Camera mode processes the full frame. Teams screen mode scans a 2×2 grid with 12% overlap, targeting one region every 25 ms. Cropping gives small hands in remote video tiles approximately twice the effective scale. Regional detections are mapped back to full-frame coordinates and deduplicated by a shared tracker supporting up to 24 hand tracks.

Only unmatched tracks in the currently scanned region are marked missing. Scanning another region therefore does not immediately hide existing hands. Each track independently maintains its orientation, debounce history, and **✓/✕** state. One participant flipping a hand does not change another hand's result; two hands from the same participant are also tracked independently.

## Paddle appearance and instruction image

Paddles are positioned near the palm using wrist and finger-base landmarks. They follow hand movement, rotation, and scale. Paddle radius adjusts to palm width, with a complete handle, flip animation, and gradual fading during occlusion.

To customize the paddle, edit `drawPaddle()` in `src/render/PaddleRenderer.ts`. It draws the colors, border, handle, circular face, and **✓/✕** paths. Rendering can also be adapted to use a transparent PNG or SVG.

To replace the English instruction poster, replace `public/assets/palm-vote-instructions-en.png` while keeping the same filename. The **Instructions** dialog loads this local image. Update its alternative text in `src/i18n.ts` if the image's meaning changes.

## Key parameters

Edit the values in `src/config.ts`:

| Parameter | Default | Purpose |
|---|---:|---|
| `maxHands` | 24 | Maximum number of tracked hands across the frame |
| `inferenceIntervalMs` | 25 ms | Target scan interval; a four-region cycle targets about 100 ms, subject to processing time |
| `minDetectionConfidence` | 0.46 | Initial detection threshold, tuned to improve detection of small or cropped hands |
| `orientationConfidence` | 0.42 | Minimum confidence for a trusted orientation |
| `orientationStableFrames` | 3 | Consecutive observations required before switching |
| `orientationStableMs` | 100 ms | Minimum duration of a stable candidate orientation |
| `smoothingAlpha` | 0.36 | Position smoothing coefficient |
| `lowConfidenceHideMs` | 900 ms | Time before hiding a paddle with an uncertain orientation |
| `occlusionHoldMs` | 650 ms | Hold time for a briefly occluded hand |
| `trackMaxAgeMs` | 1400 ms | Maximum time to retain a missing track |
| `screenRegionOverlap` | 0.12 | Overlap between adjacent Teams scan regions |

## Versions and rollback

In the original development workspace, the current application is stored at `outputs/palm-vote`. A separate camera-only backup is stored at `outputs/palm-vote-v1-camera-2026-09-03`. That backup is not included in this repository or the GitHub source package.

If you have the original workspace, run the backup independently from its workspace root:

```bash
cd outputs/palm-vote-v1-camera-2026-09-03
pnpm dev -- --port 4174
```

## Known limitations

- Teams compression, motion blur, poor lighting, and very small video tiles reduce landmark quality. For cropped hands, keep at least two extended fingers and their joints clearly visible.
- Tracking IDs may change when Teams rearranges tiles, switches the active speaker, or hands remain fully overlapped for an extended period.
- Browsers require explicit screen-sharing permission and cannot guarantee that minimized windows continue producing video frames.
- Tracking up to 24 hands depends on local CPU/GPU performance and input resolution. If performance drops, reduce `maxHands` or increase `inferenceIntervalMs`.
- The limit is 24 hands, not 24 participants. Larger meetings can be captured, but no more than 24 hands are tracked simultaneously.
- Automated tests cover orientation, tracking, region handling, and language selection. Recognition speed and accuracy in actual Teams meetings still require validation with the target cameras, layouts, and network conditions.
