import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

export type Lang = 'en' | 'hi';

const stored = (() => {
  try { return localStorage.getItem('sc.lang') as Lang | null; } catch { return null; }
})();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: stored ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', (lng) => {
  syncHtmlLang(lng);
  try { localStorage.setItem('sc.lang', lng); } catch { /* private mode */ }
});

export default i18n;
