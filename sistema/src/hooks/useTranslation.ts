'use client';

import { useI18n, useTranslation as useI18nTranslation } from '@/i18n/I18nProvider';

// Re-export for convenience
export { useI18n, useI18nTranslation as useTranslation };

// Hook for checking if language selection is needed
export function useLanguageSelection() {
  const { isLanguageSet, isLoading, setLanguage } = useI18n();
  
  return {
    needsLanguageSelection: !isLoading && !isLanguageSet,
    isLoading,
    setLanguage,
  };
}
