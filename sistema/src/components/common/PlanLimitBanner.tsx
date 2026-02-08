'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Sparkles, MessageCircle } from 'lucide-react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTranslation } from '@/i18n/I18nProvider';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';

interface PlanLimitBannerProps {
  type: 'users' | 'stores';
  currentCount: number;
}

export default function PlanLimitBanner({ type, currentCount }: PlanLimitBannerProps) {
  const { isTrial, maxUsers, planId } = usePlanFeatures();
  const { locale } = useTranslation();
  const { role } = useGetUserInfo();
  const [isVisible, setIsVisible] = useState(false);
  
  const storageKey = `plan-limit-banner-${type}-dismissed`;
  const maxLimit = type === 'users' ? maxUsers : 2; // Trial tiene máximo 2 sucursales
  
  // Solo mostrar a administradores
  const isAdmin = role === Role.Admin || role === Role.SuperAdmin;
  
  useEffect(() => {
    // Solo mostrar si es trial, es admin y no fue cerrado
    if (isTrial && isAdmin) {
      const dismissed = localStorage.getItem(storageKey);
      setIsVisible(!dismissed);
    }
  }, [isTrial, isAdmin, storageKey]);
  
  const handleDismiss = () => {
    // Guardar en localStorage para que persista hasta cerrar sesión
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };
  
  const handleUpgrade = () => {
    const message = locale === 'es' 
      ? 'Hola, quiero actualizar mi plan Trial al Plan Básico'
      : 'Hi, I want to upgrade my Trial plan to Basic Plan';
    const whatsappUrl = `https://wa.me/5491138514845?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // No mostrar si no es trial, no es admin, o fue cerrado
  if (!isTrial || !isAdmin || !isVisible) return null;
  
  const remaining = maxLimit - currentCount;
  const isNearLimit = remaining <= 1;
  
  const messages = {
    users: {
      es: {
        title: `Plan Trial: Máximo ${maxLimit} usuarios`,
        description: `Tenés ${currentCount} de ${maxLimit} usuarios. ${remaining > 0 ? `Podés agregar ${remaining} más.` : 'Alcanzaste el límite.'}`,
        upgrade: 'Actualizar al Plan Básico (hasta 8 usuarios)'
      },
      en: {
        title: `Trial Plan: Maximum ${maxLimit} users`,
        description: `You have ${currentCount} of ${maxLimit} users. ${remaining > 0 ? `You can add ${remaining} more.` : 'You reached the limit.'}`,
        upgrade: 'Upgrade to Basic Plan (up to 8 users)'
      }
    },
    stores: {
      es: {
        title: `Plan Trial: Máximo ${maxLimit} sucursales`,
        description: `Tenés ${currentCount} de ${maxLimit} sucursales. ${remaining > 0 ? `Podés agregar ${remaining} más.` : 'Alcanzaste el límite.'}`,
        upgrade: 'Actualizar al Plan Básico (hasta 5 sucursales)'
      },
      en: {
        title: `Trial Plan: Maximum ${maxLimit} stores`,
        description: `You have ${currentCount} of ${maxLimit} stores. ${remaining > 0 ? `You can add ${remaining} more.` : 'You reached the limit.'}`,
        upgrade: 'Upgrade to Basic Plan (up to 5 stores)'
      }
    }
  };
  
  const content = messages[type][locale as 'es' | 'en'] || messages[type].es;
  
  return (
    <Alert className={`relative ${isNearLimit ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}`}>
      <div className="flex items-start gap-3">
        <Sparkles className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isNearLimit ? 'text-orange-600' : 'text-blue-600'}`} />
        <div className="flex-1 space-y-2">
          <div>
            <p className={`font-semibold text-sm ${isNearLimit ? 'text-orange-900 dark:text-orange-100' : 'text-blue-900 dark:text-blue-100'}`}>
              {content.title}
            </p>
            <AlertDescription className={`text-sm mt-1 ${isNearLimit ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'}`}>
              {content.description}
            </AlertDescription>
          </div>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            {content.upgrade}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-6 w-6 flex-shrink-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
