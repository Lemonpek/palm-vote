import { describe, expect, it } from 'vitest';
import { resolveInitialLanguage } from './i18n';

describe('resolveInitialLanguage', () => {
  it('prefers a saved valid language', () => {
    expect(resolveInitialLanguage('zh', 'en-US')).toBe('zh');
    expect(resolveInitialLanguage('en', 'zh-CN')).toBe('en');
  });

  it('falls back to the browser language', () => {
    expect(resolveInitialLanguage(null, 'zh-TW')).toBe('zh');
    expect(resolveInitialLanguage('invalid', 'en-GB')).toBe('en');
  });
});
