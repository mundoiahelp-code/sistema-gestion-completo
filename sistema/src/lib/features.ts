/**
 * Feature flags configuration
 * Features are determined by the selected locale:
 * - Spanish (es): Full system with CRM, WhatsApp, Appointments, Bot
 * - English (en): Basic inventory management only
 */

import { Locale } from '@/i18n';

// Get locale from localStorage (client-side only)
function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'es';
  return (localStorage.getItem('app_locale') as Locale) || 'es';
}

// Features based on locale
export function getFeaturesForLocale(locale: Locale) {
  const isSpanish = locale === 'es';
  return {
    crm: isSpanish,
    whatsapp: isSpanish,
    appointments: isSpanish,
    bot: isSpanish,
    integrations: isSpanish,
    dolarBlue: isSpanish,
  };
}

// Default features (will be updated based on locale)
export const features = {
  crm: true,
  whatsapp: true,
  appointments: true,
  bot: true,
  integrations: true,
  dolarBlue: true,
};

// Update features based on current locale
export function updateFeatures(locale: Locale) {
  const localeFeatures = getFeaturesForLocale(locale);
  features.crm = localeFeatures.crm;
  features.whatsapp = localeFeatures.whatsapp;
  features.appointments = localeFeatures.appointments;
  features.bot = localeFeatures.bot;
  features.integrations = localeFeatures.integrations;
  features.dolarBlue = localeFeatures.dolarBlue;
}

export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature];
}
