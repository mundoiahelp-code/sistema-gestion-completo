import { LucideIcon } from 'lucide-react';

import { Role } from '@/enums/role.enum';
import { Locale } from '@/i18n';

export interface IMenu {
  text: string;
  textKey?: string; // i18n translation key
  icon: LucideIcon;
  href: string;
  global: boolean;
  visible: Role[];
  hideInLocales?: Locale[]; // Hide menu item in specific locales
  featureFlag?: string; // Feature flag to check if menu item should be shown
  requiresBasic?: boolean; // Requires Basic plan or higher
  requiresPro?: boolean; // Requires Pro plan to access
}
