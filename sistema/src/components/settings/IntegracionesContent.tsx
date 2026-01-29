'use client';

import { useTranslation } from '@/i18n/I18nProvider';
import { usePlan } from '@/hooks/usePlan';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';
import { Card } from '@/components/ui/card';
import { Instagram, Lock } from 'lucide-react';
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
            Las integraciones con WhatsApp están disponibles en el plan Básico y Profesional.
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
            ? 'Conecta tu cuenta de WhatsApp para gestionar mensajes desde el CRM'
            : 'Connect your WhatsApp account to manage messages from the CRM'}
        </p>
      </div>

      <WhatsAppSettings />
      
      {/* Instagram - Próximamente */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Instagram Direct Messages</h3>
            <p className="text-sm text-zinc-500">
              {locale === 'es' 
                ? 'Responde mensajes de Instagram desde el CRM'
                : 'Reply to Instagram messages from the CRM'}
            </p>
          </div>
        </div>
        
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium">
            🚀 {locale === 'es' ? 'Próximamente' : 'Coming Soon'}
          </span>
          <p className="text-sm text-zinc-500 mt-2">
            {locale === 'es'
              ? 'Estamos trabajando en esta integración. Pronto podrás conectar tu cuenta de Instagram.'
              : 'We are working on this integration. Soon you will be able to connect your Instagram account.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
