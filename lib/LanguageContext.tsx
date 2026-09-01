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
  // Default to English as requested
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('olak_language') as Language;
    if (saved === 'ur') {
      setLangState('ur');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ur';
    } else {
      setLangState('en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
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
      <div className={isUrdu ? 'font-urdu leading-normal' : 'font-sans'} dir={isUrdu ? 'rtl' : 'ltr'}>
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
