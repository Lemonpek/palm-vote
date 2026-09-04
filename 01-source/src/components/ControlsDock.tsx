import type { ExperienceStatus } from '../types';
import type { AppCopy } from '../i18n';
import type { InputSource } from '../types';
import { CameraIcon, FullscreenIcon, ScreenIcon, StopIcon } from './Icons';
import { Toggle } from './Toggle';

type ControlsDockProps = {
  devices: MediaDeviceInfo[];
  source: InputSource;
  onSourceChange: (source: InputSource) => void;
  selectedDeviceId: string;
  onDeviceChange: (id: string) => void;
  onStart: () => void;
  onStop: () => void;
  onFullscreen: () => void;
  mirror: boolean;
  onMirrorChange: (value: boolean) => void;
  debug: boolean;
  onDebugChange: (value: boolean) => void;
  onInstructions: () => void;
  status: ExperienceStatus;
  copy: AppCopy;
};

export function ControlsDock(props: ControlsDockProps) {
  const running = props.status === 'running' || props.status === 'loading-model' || props.status === 'requesting';
  return (
    <div className="controls-dock" aria-label={props.copy.controls.aria}>
      <div className="controls-dock__inputs">
        <label className="device-control source-control">
          <span>{props.copy.controls.source}</span>
          <select value={props.source} onChange={(event) => props.onSourceChange(event.target.value as InputSource)}>
            <option value="screen">{props.copy.controls.screen}</option>
            <option value="camera">{props.copy.controls.camera}</option>
          </select>
        </label>
        {props.source === 'camera' ? <label className="device-control camera-device-control">
          <span>{props.copy.controls.cameraDevice}</span>
          <select value={props.selectedDeviceId} onChange={(event) => props.onDeviceChange(event.target.value)}>
            {props.devices.length ? props.devices.map((device, index) => (
              <option key={device.deviceId || index} value={device.deviceId}>
                {device.label || `${props.copy.controls.cameraDevice} ${index + 1}`}
              </option>
            )) : <option value="">{props.copy.controls.defaultCamera}</option>}
          </select>
        </label> : null}
      </div>
      <div className="controls-dock__actions">
        <button className="button button--primary" type="button" onClick={props.onStart} disabled={running}>
          {props.source === 'screen' ? <ScreenIcon /> : <CameraIcon />}
          {props.source === 'screen' ? props.copy.controls.startScreen : props.copy.controls.startCamera}
        </button>
        <button className="button button--secondary" type="button" onClick={props.onStop} disabled={!running}>
          <StopIcon />{props.copy.controls.stop}
        </button>
      </div>
      <div className="controls-dock__toggles">
        <Toggle label={props.copy.controls.mirror} checked={props.mirror} onChange={props.onMirrorChange} />
        <Toggle label={props.copy.controls.debug} checked={props.debug} onChange={props.onDebugChange} />
        <button className="button button--icon-text" type="button" onClick={props.onInstructions}>
          {props.copy.controls.instructions}
        </button>
        <button className="button button--icon-text" type="button" onClick={props.onFullscreen}>
          <FullscreenIcon />{props.copy.controls.fullscreen}
        </button>
      </div>
    </div>
  );
}
