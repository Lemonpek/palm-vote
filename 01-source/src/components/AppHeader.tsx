import type { AppCopy, Language } from '../i18n';
import type { ExperienceStatus } from '../types';
import { BrandMark } from './BrandMark';

type HeaderProps = {
  status: ExperienceStatus;
  handCount: number;
  language: Language;
  copy: AppCopy;
  onLanguageChange: () => void;
};

export function AppHeader({ status, handCount, language, copy, onLanguageChange }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand"><BrandMark /><span>{copy.brand}</span></div>
      <div className="header-actions">
        <button
          className="language-switch"
          type="button"
          onClick={onLanguageChange}
          aria-label={copy.switchLanguage}
          title={copy.switchLanguage}
        >
          <span className={language === 'zh' ? 'is-active' : ''}>中</span>
          <i>/</i>
          <span className={language === 'en' ? 'is-active' : ''}>EN</span>
        </button>
        <div className="header-status" aria-live="polite">
          <span className={`status-dot status-dot--${status}`} />
          <span className="header-status__label">{copy.status[status]}</span>
          <span className="header-status__divider" />
          <strong>{handCount}</strong><span>{handCount === 1 ? copy.handUnitOne : copy.handUnit}</span>
        </div>
      </div>
    </header>
  );
}
