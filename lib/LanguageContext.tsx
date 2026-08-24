'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';
import { translations } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['en'];
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>('ur'); // Default to Urdu/Bilingual as requested by client

  useEffect(() => {
    const saved = localStorage.getItem('olak_language') as Language;
    if (saved === 'en' || saved === 'ur') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('olak_language', newLang);
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const t = translations[lang] || translations.en;
  const isUrdu = lang === 'ur';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isUrdu }}>
      <div className={isUrdu ? 'font-urdu' : ''} dir={isUrdu ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
