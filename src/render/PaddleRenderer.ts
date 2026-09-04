import { HAND_CONFIG } from '../config';
import type { AppCopy } from '../i18n';
import type { DetectionRegion, Point3D, TrackedHand } from '../types';

type AnimationState = { state: TrackedHand['state']; previous: TrackedHand['state']; startedAt: number };
type CameraTransform = { scale: number; offsetX: number; offsetY: number; sourceWidth: number; sourceHeight: number };

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class PaddleRenderer {
  private animations = new Map<number, AnimationState>();

  draw(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    tracks: TrackedHand[],
    now: number,
    mirror: boolean,
    debug: boolean,
    labels: AppCopy['debug'],
    scanRegion?: DetectionRegion,
  ): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.max(1, Math.round(rect.width * dpr));
    const targetHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#05080d';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const sourceWidth = video.videoWidth || 16;
    const sourceHeight = video.videoHeight || 9;
    const transform = this.cameraTransform(rect.width, rect.height, sourceWidth, sourceHeight);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, rect.width, rect.height);
      ctx.clip();
      if (mirror) {
        ctx.translate(rect.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, transform.offsetX, transform.offsetY, sourceWidth * transform.scale, sourceHeight * transform.scale);
      } else {
        ctx.drawImage(video, transform.offsetX, transform.offsetY, sourceWidth * transform.scale, sourceHeight * transform.scale);
      }
      ctx.restore();
    }

    const activeIds = new Set<number>();
    if (debug && scanRegion) this.drawScanRegion(ctx, scanRegion, transform, mirror, rect.width, labels.region);
    for (const track of tracks) {
      activeIds.add(track.id);
      const trustedAge = now - track.lastTrustedOrientationAt;
      if (track.lastTrustedOrientationAt === 0 || trustedAge > HAND_CONFIG.lowConfidenceHideMs) {
        if (debug) this.drawDebug(ctx, track, transform, mirror, rect.width, now, false, labels);
        continue;
      }
      const occlusionAge = Math.max(0, now - track.lastSeenAt);
      const alpha = 1 - clamp(occlusionAge / HAND_CONFIG.occlusionHoldMs, 0, 1) * 0.72;
      this.drawTrackedPaddle(ctx, track, transform, mirror, rect.width, rect.height, now, alpha);
      if (debug) this.drawDebug(ctx, track, transform, mirror, rect.width, now, true, labels);
    }
    for (const id of this.animations.keys()) {
      if (!activeIds.has(id)) this.animations.delete(id);
    }
  }

  reset(): void {
    this.animations.clear();
  }

  private cameraTransform(width: number, height: number, sourceWidth: number, sourceHeight: number): CameraTransform {
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    return {
      scale,
      offsetX: (width - sourceWidth * scale) / 2,
      offsetY: (height - sourceHeight * scale) / 2,
      sourceWidth,
      sourceHeight,
    };
  }

  private map(point: Point3D, t: CameraTransform, mirror: boolean, width: number): Point3D {
    const rawX = t.offsetX + point.x * t.sourceWidth * t.scale;
    return {
      x: mirror ? width - rawX : rawX,
      y: t.offsetY + point.y * t.sourceHeight * t.scale,
      z: point.z,
    };
  }

  private drawTrackedPaddle(
    ctx: CanvasRenderingContext2D,
    track: TrackedHand,
    transform: CameraTransform,
    mirror: boolean,
    width: number,
    height: number,
    now: number,
    alpha: number,
  ): void {
    const wrist = this.map(track.landmarks[0], transform, mirror, width);
    const middle = this.map(track.landmarks[9], transform, mirror, width);
    const center = this.map(track.center, transform, mirror, width);
    const vx = middle.x - wrist.x;
    const vy = middle.y - wrist.y;
    const length = Math.max(1, Math.hypot(vx, vy));
    const fingerX = vx / length;
    const fingerY = vy / length;
    const outwardX = center.x < width / 2 ? -1 : 1;
    const palmPixels = track.scale * transform.sourceWidth * transform.scale;
    const radius = clamp(palmPixels * 0.68, 28, Math.min(92, width * 0.085));
    const faceX = clamp(center.x + fingerX * radius * 0.68 + outwardX * radius * 0.45, radius + 8, width - radius - 8);
    const faceY = clamp(center.y + fingerY * radius * 0.35, radius + 8, height - radius * 2.1);
    const angle = Math.atan2(-fingerY, -fingerX) - Math.PI / 2;

    let animation = this.animations.get(track.id);
    if (!animation) {
      animation = { state: track.state, previous: track.state, startedAt: now };
      this.animations.set(track.id, animation);
    } else if (animation.state !== track.state) {
      animation = { state: track.state, previous: animation.state, startedAt: now };
      this.animations.set(track.id, animation);
    }
    const progress = clamp((now - animation.startedAt) / 260, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const flipScale = Math.max(0.08, Math.abs(Math.cos(eased * Math.PI)));
    const shownState = eased < 0.5 ? animation.previous : animation.state;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(faceX, faceY);
    ctx.rotate(angle);
    ctx.scale(flipScale, 1);
    this.drawPaddle(ctx, radius, shownState);
    ctx.restore();
  }

  private drawPaddle(ctx: CanvasRenderingContext2D, radius: number, state: TrackedHand['state']): void {
    const fill = state === 'yes' ? '#2fb663' : '#ef3f45';
    const darkEdge = state === 'yes' ? '#14783c' : '#aa2229';
    const handleWidth = radius * 0.48;
    const handleLength = radius * 1.35;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = radius * 0.25;
    ctx.shadowOffsetY = radius * 0.12;
    ctx.fillStyle = darkEdge;
    this.roundRect(ctx, -handleWidth / 2 - 3, radius * 0.56, handleWidth + 6, handleLength + 9, handleWidth / 2 + 3);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = fill;
    this.roundRect(ctx, -handleWidth / 2, radius * 0.58, handleWidth, handleLength, handleWidth / 2);
    ctx.fill();
    ctx.strokeStyle = '#f5f8f2';
    ctx.lineWidth = Math.max(2.5, radius * 0.055);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = darkEdge;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#f8fbf5';
    ctx.lineWidth = Math.max(3, radius * 0.065);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.86, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = Math.max(1.5, radius * 0.025);
    ctx.stroke();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = radius * 0.16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (state === 'yes') {
      ctx.moveTo(-radius * 0.47, 0);
      ctx.lineTo(-radius * 0.13, radius * 0.3);
      ctx.lineTo(radius * 0.52, -radius * 0.38);
    } else {
      ctx.moveTo(-radius * 0.38, -radius * 0.38);
      ctx.lineTo(radius * 0.38, radius * 0.38);
      ctx.moveTo(radius * 0.38, -radius * 0.38);
      ctx.lineTo(-radius * 0.38, radius * 0.38);
    }
    ctx.stroke();
  }

  private drawDebug(
    ctx: CanvasRenderingContext2D,
    track: TrackedHand,
    transform: CameraTransform,
    mirror: boolean,
    width: number,
    now: number,
    trusted: boolean,
    labels: AppCopy['debug'],
  ): void {
    const points = track.landmarks.map((point) => this.map(point, transform, mirror, width));
    ctx.save();
    ctx.globalAlpha = now - track.lastSeenAt > 0 ? 0.48 : 0.92;
    ctx.strokeStyle = trusted ? '#6ee7a2' : '#f5b942';
    ctx.fillStyle = trusted ? '#9af0bd' : '#ffd477';
    ctx.lineWidth = 1.4;
    for (const [from, to] of CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(points[from].x, points[from].y);
      ctx.lineTo(points[to].x, points[to].y);
      ctx.stroke();
    }
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    ctx.strokeRect(minX - 8, minY - 8, maxX - minX + 16, maxY - minY + 16);
    const handedness = track.handedness === 'Left' ? labels.left : track.handedness === 'Right' ? labels.right : labels.unknown;
    const label = `#${track.id} · ${handedness} · ${labels[track.orientation.label]} · ${Math.round(track.orientation.confidence * 100)}%`;
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    const labelWidth = ctx.measureText(label).width + 16;
    ctx.fillStyle = 'rgba(8, 12, 18, .86)';
    this.roundRect(ctx, minX - 8, Math.max(8, minY - 34), labelWidth, 23, 6);
    ctx.fill();
    ctx.fillStyle = '#eaf2f7';
    ctx.fillText(label, minX, Math.max(24, minY - 18));
    ctx.restore();
  }

  private drawScanRegion(
    ctx: CanvasRenderingContext2D,
    region: DetectionRegion,
    transform: CameraTransform,
    mirror: boolean,
    width: number,
    label: string,
  ): void {
    const start = this.map({ x: region.x, y: region.y, z: 0 }, transform, mirror, width);
    const end = this.map({ x: region.x + region.width, y: region.y + region.height, z: 0 }, transform, mirror, width);
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const boxWidth = Math.abs(end.x - start.x);
    const boxHeight = Math.abs(end.y - start.y);
    ctx.save();
    ctx.strokeStyle = 'rgba(136, 220, 255, .48)';
    ctx.setLineDash([7, 6]);
    ctx.strokeRect(left, top, boxWidth, boxHeight);
    ctx.setLineDash([]);
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(6, 10, 15, .72)';
    this.roundRect(ctx, left + 8, top + 8, ctx.measureText(label).width + 16, 23, 6);
    ctx.fill();
    ctx.fillStyle = '#b9e9ff';
    ctx.fillText(label, left + 16, top + 24);
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }
}
