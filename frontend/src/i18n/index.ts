import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { pt } from './pt';
import { en } from './en';

const saved = localStorage.getItem('lang') || 'pt';

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: saved,
  fallbackLng: 'pt', // strings não traduzidas caem para PT (degradação graciosa)
  interpolation: { escapeValue: false },
});

export function setLanguage(lng: 'pt' | 'en') {
  localStorage.setItem('lang', lng);
  i18n.changeLanguage(lng);
}

export default i18n;
