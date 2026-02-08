'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Locale } from '@/i18n';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { updateFeatures } from '@/lib/features';
import Cookies from 'js-cookie';

interface LanguageSelectorProps {
  onComplete?: () => void;
}

export function LanguageSelector({ onComplete }: LanguageSelectorProps) {
  const { setLanguage, isLanguageSet } = useI18n();
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isLanguageSet || !selectedLocale) return;

    setIsSubmitting(true);
    try {
      // Update features based on selected locale
      updateFeatures(selectedLocale);
      
      // Save locale to tenant via API
      const token = Cookies.get('token') || Cookies.get('accessToken');
      if (token) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/current/locale`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ locale: selectedLocale }),
          });
        } catch (error) {
          console.error('Error saving locale to tenant:', error);
        }
      }
      
      await setLanguage(selectedLocale);
      onComplete?.();
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages: { 
    locale: Locale; 
    name: string; 
    flag: string; 
  }[] = [
    {
      locale: 'es',
      name: 'Español',
      flag: '🇦🇷',
    },
    {
      locale: 'en',
      name: 'English',
      flag: '🇺🇸',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image
              src="/images/logo-icon.png"
              alt="Clodeb"
              height={40}
              width={40}
            />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Choose your language
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Elegí el idioma según tu país
          </p>
        </div>

        {/* Language Options */}
        <div className="space-y-3 mb-4">
          {languages.map((lang) => (
            <button
              key={lang.locale}
              onClick={() => setSelectedLocale(lang.locale)}
              className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                selectedLocale === lang.locale
                  ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="flex-1 text-left font-medium text-zinc-900 dark:text-zinc-100">
                {lang.name}
              </span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedLocale === lang.locale
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {selectedLocale === lang.locale && (
                  <Check className="w-3 h-3 text-white dark:text-zinc-900" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-6">
          <span className="text-amber-500 text-base mt-0.5">⚠️</span>
          <div className="text-xs text-amber-700 dark:text-amber-400">
            <p>This cannot be changed later</p>
            <p>No se puede cambiar después</p>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !selectedLocale}
          className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white dark:text-zinc-900 font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>
      </div>
    </div>
  );
}
