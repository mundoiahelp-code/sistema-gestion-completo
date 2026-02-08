import {
  HomeIcon,
  PackageIcon,
  SmartphoneIcon,
  TagIcon,
  BoxIcon,
  CalendarIcon,
  MessageCircleIcon,
  Activity,
} from 'lucide-react';

import { Role } from '@/enums/role.enum';
import { IMenu } from '@/interfaces/layout.interface';
import { Locale } from '@/i18n';
import { getFeaturesForLocale } from './features';

export const Menu: IMenu[] = [
  {
    text: 'Inicio',
    textKey: 'nav.dashboard',
    icon: HomeIcon,
    global: true,
    visible: [],
    href: '/inicio',
  },
  {
    text: 'Celulares',
    textKey: 'nav.phones',
    icon: SmartphoneIcon,
    global: true,
    visible: [],
    href: '/productos',
  },
  {
    text: 'Accesorios',
    textKey: 'nav.accessories',
    icon: PackageIcon,
    global: true,
    visible: [],
    href: '/accesorios',
  },
  {
    text: 'Ingresos',
    textKey: 'nav.inventory',
    icon: BoxIcon,
    global: true,
    visible: [],
    href: '/ingresos',
  },
  {
    text: 'Ventas',
    textKey: 'nav.sales',
    icon: TagIcon,
    global: true,
    visible: [],
    href: '/ventas',
  },
  {
    text: 'Turnos',
    textKey: 'nav.appointments',
    icon: CalendarIcon,
    global: true,
    visible: [],
    href: '/turnos',
  },
  {
    text: 'CRM',
    textKey: 'nav.crm',
    icon: MessageCircleIcon,
    global: true,
    visible: [Role.Admin, Role.Seller], // ADMIN y SELLER pueden ver CRM
    href: '/crm',
    featureFlag: 'crm',
    requiresBasic: true, // Básico: puede escanear QR y ver mensajes. Pro: + bot IA
  },
  // {
  //   text: 'Historial',
  //   textKey: 'nav.history',
  //   icon: Activity,
  //   global: true,
  //   visible: [Role.Admin], // Solo ADMIN puede ver historial
  //   href: '/historial',
  // },
];

// Helper to filter menu by locale - features are determined by locale
export const getMenuForLocale = (locale: Locale): IMenu[] => {
  const localeFeatures = getFeaturesForLocale(locale);
  
  return Menu.filter((item) => {
    // Check locale restriction
    if (item.hideInLocales?.includes(locale)) return false;
    
    // Check feature flag based on locale
    if (item.featureFlag) {
      const featureKey = item.featureFlag as keyof typeof localeFeatures;
      if (!localeFeatures[featureKey]) return false;
    }
    
    return true;
  });
};
