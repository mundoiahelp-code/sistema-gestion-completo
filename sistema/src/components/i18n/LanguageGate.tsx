'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { updateFeatures } from '@/lib/features';

interface LanguageGateProps {
  children: ReactNode;
}

export function LanguageGate({ children }: LanguageGateProps) {
  const { isLoading, isLanguageSet, locale, setLanguage } = useI18n();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verificar si el usuario ya tiene locale definido en el tenant
    const checkUserLocale = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.tenant?.locale) {
            // El tenant ya tiene locale definido, guardarlo
            localStorage.setItem('app_locale', user.tenant.locale);
            localStorage.setItem('language_set', 'true');
            setChecking(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error checking user locale:', e);
      }
      
      // Si no hay locale del tenant y no está seteado, setear español automáticamente
      if (!isLoading && !isLanguageSet) {
        // Setear español por defecto sin mostrar selector
        localStorage.setItem('app_locale', 'es');
        localStorage.setItem('language_set', 'true');
        updateFeatures('es');
        await setLanguage('es');
      }
      setChecking(false);
    };

    if (!isLoading) {
      checkUserLocale();
    }
  }, [isLoading, isLanguageSet, setLanguage]);

  // Update features when locale changes
  useEffect(() => {
    if (isLanguageSet && locale) {
      updateFeatures(locale);
    }
  }, [isLanguageSet, locale]);

  // Show loading state
  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Show app content
  return <>{children}</>;
}
