'use client';

import { useTranslation } from '@/i18n/I18nProvider';
import { usePlan } from '@/hooks/usePlan';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';
import InstagramSettings from '@/components/settings/InstagramSettings';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function IntegracionesContent() {
  const { t, locale } = useTranslation();
  const { canAccess, loading } = usePlan();
  const { role } = useGetUserInfo();
  const isSuperAdmin = role === Role.SuperAdmin;
  
  // Check plan access (SuperAdmin always has access)
  if (!loading && !canAccess('integrations') && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold">Integraciones</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Las integraciones con WhatsApp e Instagram están disponibles en el plan Básico y Profesional.
          </p>
          <Link href="/ajustes/plan">
            <Button className="mt-4">
              Ver Planes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('settings.integrations')}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {locale === 'es'
            ? 'Conecta tus cuentas de WhatsApp e Instagram para gestionar mensajes desde el CRM'
            : 'Connect your WhatsApp and Instagram accounts to manage messages from the CRM'}
        </p>
      </div>

      <WhatsAppSettings />
      
      <InstagramSettings />
    </div>
  );
}
