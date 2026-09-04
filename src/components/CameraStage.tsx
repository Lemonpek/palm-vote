import type { AppCopy } from '../i18n';
import type { AppError, ExperienceStatus, InputSource } from '../types';
import { AlertIcon, CameraIcon, ScreenIcon } from './Icons';

type CameraStageProps = {
  stageRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: ExperienceStatus;
  error: AppError | null;
  onStart: () => void;
  debug: boolean;
  fps: number;
  copy: AppCopy;
  source: InputSource;
};

export function CameraStage({ stageRef, videoRef, canvasRef, status, error, onStart, debug, fps, copy, source }: CameraStageProps) {
  const isInactive = status === 'idle' || status === 'stopped';
  const isLoading = status === 'requesting' || status === 'loading-model';
  const errorCopy = error ? copy.errors[error.code] : null;
  return (
    <section className="camera-stage" ref={stageRef} aria-label={copy.stage.aria}>
      <video ref={videoRef} className="camera-stage__video" aria-hidden="true" />
      <canvas ref={canvasRef} className="camera-stage__canvas" />
      {isInactive ? (
        <div className="stage-message">
          <div className="stage-message__symbol">{source === 'screen' ? <ScreenIcon size={30} /> : <CameraIcon size={30} />}</div>
          <h1>{copy.stage.headline}</h1>
          <p>{copy.stage.description}</p>
          <button className="button button--primary stage-message__button" type="button" onClick={onStart}>
            {source === 'screen' ? <ScreenIcon size={19} /> : <CameraIcon size={19} />}
            {source === 'screen' ? copy.controls.startScreen : copy.controls.startCamera}
          </button>
        </div>
      ) : null}
      {isLoading ? (
        <div className="stage-message stage-message--loading" role="status">
          <span className="loading-ring" />
          <h2>{status === 'requesting' ? (source === 'screen' ? copy.stage.requestingScreen : copy.stage.requestingCamera) : copy.stage.preparing}</h2>
          <p>{copy.stage.firstLoad}</p>
        </div>
      ) : null}
      {status === 'error' && errorCopy ? (
        <div className="stage-message stage-message--error" role="alert">
          <div className="stage-message__symbol stage-message__symbol--error"><AlertIcon /></div>
          <h2>{errorCopy.title}</h2>
          <p>{errorCopy.detail}</p>
          <span className="error-recovery">{errorCopy.recovery}</span>
          <button className="button button--secondary stage-message__button" type="button" onClick={onStart}>{copy.stage.retry}</button>
        </div>
      ) : null}
      {status === 'running' ? <span className="local-processing">{copy.stage.localOnly}</span> : null}
      {status === 'running' && debug ? <span className="debug-fps">{copy.debug.inference} {fps} FPS</span> : null}
    </section>
  );
}
