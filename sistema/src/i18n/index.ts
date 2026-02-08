import en from './locales/en.json';
import es from './locales/es.json';

export type Locale = 'en' | 'es';

export const locales: Record<Locale, typeof en> = {
  en,
  es,
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export const defaultLocale: Locale = 'en';

// Helper function to get nested translation
export function getTranslation(
  translations: typeof en,
  key: string
): string {
  const keys = key.split('.');
  let result: any = translations;
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : key;
}
