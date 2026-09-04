import { HAND_CONFIG } from '../config';
import type { AppCopy } from '../i18n';
import { ChevronIcon, GearIcon } from './Icons';

export function HelpPanel({ copy }: { copy: AppCopy }) {
  return (
    <details className="help-panel">
      <summary><span><GearIcon />{copy.help.title}</span><ChevronIcon className="help-panel__chevron" /></summary>
      <div className="help-panel__content">
        <section>
          <h3>{copy.help.parameters}</h3>
          <dl className="parameter-list">
            <div><dt>{copy.help.maxHands}</dt><dd>{HAND_CONFIG.maxHands}</dd></div>
            <div><dt>{copy.help.confidence}</dt><dd>{HAND_CONFIG.minDetectionConfidence}</dd></div>
            <div><dt>{copy.help.orientation}</dt><dd>{HAND_CONFIG.orientationStableFrames} {copy.help.frames} / {HAND_CONFIG.orientationStableMs} ms</dd></div>
            <div><dt>{copy.help.occlusion}</dt><dd>{HAND_CONFIG.occlusionHoldMs} ms</dd></div>
            <div><dt>{copy.help.smoothing}</dt><dd>{HAND_CONFIG.smoothingAlpha}</dd></div>
          </dl>
        </section>
        <section>
          <h3>{copy.help.teamsTitle}</h3>
          <ol>
            <li>{copy.help.teams1}</li>
            <li>{copy.help.teams2}</li>
            <li>{copy.help.teams3}</li>
          </ol>
          <h3>{copy.help.tipsTitle}</h3>
          <ul>
            <li>{copy.help.tip1}</li>
            <li>{copy.help.tip2}</li>
            <li>{copy.help.tip3}</li>
            <li>{copy.help.tip4}</li>
          </ul>
        </section>
      </div>
    </details>
  );
}
