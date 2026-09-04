import { useEffect, useRef, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { CameraStage } from './components/CameraStage';
import { ControlsDock } from './components/ControlsDock';
import { HelpPanel } from './components/HelpPanel';
import { ShieldIcon } from './components/Icons';
import { useHandExperience } from './hooks/useHandExperience';
import { COPY, LANGUAGE_STORAGE_KEY, resolveInitialLanguage, type Language } from './i18n';

function initialLanguage(): Language {
  let saved: string | null = null;
  try { saved = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* storage may be disabled */ }
  return resolveInitialLanguage(saved, navigator.language);
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const instructionDialogRef = useRef<HTMLDialogElement>(null);
  const [mirror, setMirror] = useState(false);
  const [debug, setDebug] = useState(false);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const copy = COPY[language];
  const experience = useHandExperience({ videoRef, canvasRef, mirror, debug, debugCopy: copy.debug });

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = copy.pageTitle;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* storage may be disabled */ }
  }, [copy.pageTitle, language]);

  const enterFullscreen = async () => {
    if (!stageRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageRef.current.requestFullscreen();
  };

  return (
    <div className="app-shell">
      <AppHeader
        status={experience.status}
        handCount={experience.handCount}
        language={language}
        copy={copy}
        onLanguageChange={() => setLanguage((current) => current === 'zh' ? 'en' : 'zh')}
      />
      <main>
        <div className="experience-frame">
          <CameraStage
            stageRef={stageRef}
            videoRef={videoRef}
            canvasRef={canvasRef}
            status={experience.status}
            error={experience.error}
            onStart={() => void experience.start()}
            debug={debug}
            fps={experience.fps}
            copy={copy}
            source={experience.source}
          />
          <ControlsDock
            source={experience.source}
            onSourceChange={(source) => {
              experience.selectSource(source);
              setMirror(source === 'camera');
            }}
            devices={experience.devices}
            selectedDeviceId={experience.selectedDeviceId}
            onDeviceChange={(id) => void experience.selectDevice(id)}
            onStart={() => void experience.start()}
            onStop={experience.stop}
            onFullscreen={() => void enterFullscreen()}
            mirror={mirror}
            onMirrorChange={setMirror}
            debug={debug}
            onDebugChange={setDebug}
            onInstructions={() => instructionDialogRef.current?.showModal()}
            status={experience.status}
            copy={copy}
          />
        </div>

        <section className="instruction" aria-labelledby="instruction-title">
          <h2 id="instruction-title">{copy.instruction.headline}</h2>
          <p>{copy.instruction.palm} <strong className="yes-text">✓</strong>{copy.instruction.separator} {copy.instruction.back} <strong className="no-text">✕</strong></p>
          <p className="privacy"><ShieldIcon />{copy.instruction.privacy}</p>
        </section>

        <HelpPanel copy={copy} />
      </main>
      <footer>{copy.instruction.footer}</footer>
      <dialog ref={instructionDialogRef} className="instruction-dialog" aria-label={copy.instruction.dialogLabel}>
        <div className="instruction-dialog__content">
          <img
            src="/assets/palm-vote-instructions-en.png"
            width="1672"
            height="941"
            alt={copy.instruction.imageAlt}
            decoding="async"
          />
          <button
            className="instruction-dialog__close"
            type="button"
            aria-label={copy.instruction.close}
            title={copy.instruction.close}
            onClick={() => instructionDialogRef.current?.close()}
          >×</button>
        </div>
      </dialog>
    </div>
  );
}
