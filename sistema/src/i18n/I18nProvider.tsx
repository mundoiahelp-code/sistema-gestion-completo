'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Locale, locales, defaultLocale, getTranslation } from './index';
import en from './locales/en.json';

type TranslationKeys = typeof en;

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  isLoading: boolean;
  isLanguageSet: boolean;
  setLanguage: (locale: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  tenantId?: string;
}

export function I18nProvider({ children, tenantId }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageSet, setIsLanguageSet] = useState(false);

  // Load language preference from localStorage (set during login from tenant)
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Check localStorage for cached preference (set during login from tenant.locale)
        const cachedLocale = localStorage.getItem('app_locale') as Locale | null;
        const languageSet = localStorage.getItem('language_set') === 'true';
        
        if (cachedLocale && locales[cachedLocale]) {
          setLocale(cachedLocale);
          setIsLanguageSet(languageSet);
        }
      } catch (error) {
        // Error silencioso en producción
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Set language (one-time only during onboarding)
  const setLanguage = async (newLocale: Locale) => {
    if (isLanguageSet) {
      // Idioma ya configurado, no se puede cambiar
      return;
    }

    setLocale(newLocale);
    setIsLanguageSet(true);
    localStorage.setItem('app_locale', newLocale);
    localStorage.setItem('language_set', 'true');
  };

  // Translation function
  const t = (key: string): string => {
    return getTranslation(locales[locale], key);
  };

  return (
    <I18nContext.Provider value={{ locale, t, isLoading, isLanguageSet, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
