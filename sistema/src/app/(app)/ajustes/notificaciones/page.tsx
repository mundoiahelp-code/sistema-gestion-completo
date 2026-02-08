'use client';

import NotificationSettings from '@/components/settings/NotificationSettings';
import { Construction, Wrench } from 'lucide-react';

const PageAjustesNotificaciones = () => {
  return (
    <div className="relative">
      {/* Contenido original con blur */}
      <div className="pointer-events-none select-none filter blur-[2px] opacity-50">
        <NotificationSettings />
      </div>
      
      {/* Overlay de mantenimiento */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-lg">
        <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl p-8 max-w-md text-center shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <Construction className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            En mantenimiento
          </h2>
          <p className="text-zinc-400 mb-4">
            Las notificaciones están temporalmente deshabilitadas mientras trabajamos en mejoras.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Wrench className="h-4 w-4" />
            <span>Próximamente disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageAjustesNotificaciones;
