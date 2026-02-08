'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Building2, Plug, Smartphone } from 'lucide-react';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';
import { useTranslation } from '@/i18n/I18nProvider';
import { getFeaturesForLocale } from '@/lib/features';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role } = useGetUserInfo();
  const { locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  const { hasIntegrations } = usePlanFeatures();
  const isAdmin = role === Role.Admin || role === Role.SuperAdmin;
  const isSpanish = locale === 'es';

  const menu = [
    { 
      name: isSpanish ? 'General' : 'General', 
      href: '/ajustes/general', 
      icon: User, 
      adminOnly: false,
      showAlways: true 
    },
    { 
      name: isSpanish ? 'Seguridad' : 'Security', 
      href: '/ajustes/seguridad', 
      icon: Shield, 
      adminOnly: false,
      showAlways: true 
    },
    { 
      name: isSpanish ? 'Modelos' : 'Models', 
      href: '/ajustes/modelos', 
      icon: Smartphone, 
      adminOnly: true,
      showAlways: true 
    },
    { 
      name: isSpanish ? 'Integraciones' : 'Integrations', 
      href: '/ajustes/integraciones', 
      icon: Plug, 
      adminOnly: true,
      requiresPlan: true,
      showAlways: false 
    },
  ];

  // Filter menu by role and features
  const filteredMenu = menu.filter(item => {
    // Check admin requirement
    if (item.adminOnly && !isAdmin) return false;
    // Check plan requirement (Integraciones requiere plan Basic+)
    if (item.requiresPlan && !hasIntegrations) return false;
    // Check feature requirement
    if (item.requiresFeature && !localeFeatures[item.requiresFeature as keyof typeof localeFeatures]) return false;
    return true;
  });

  return (
    <>
      <div className='mx-auto grid w-full max-w-6xl gap-2'>
        <h1 className='text-3xl font-bold'>{isSpanish ? 'Ajustes' : 'Settings'}</h1>
        <p className='text-muted-foreground'>
          {isSpanish 
            ? 'Administrá tu cuenta y preferencias del sistema'
            : 'Manage your account and system preferences'}
        </p>
      </div>
      <div className='mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'>
        <nav className='grid gap-2'>
          {filteredMenu.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={i}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className='h-4 w-4' />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className='grid gap-6'>{children}</div>
      </div>
    </>
  );
}
