'use client';

import { useRouter } from 'next/navigation';
import { Wrench, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HistorialPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-6">
            <Wrench className="h-16 w-16 text-amber-600 dark:text-amber-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            En Mantenimiento
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            El módulo de Historial está temporalmente deshabilitado mientras trabajamos en mejoras.
          </p>
        </div>

        {/* Botón */}
        <Button 
          onClick={() => router.push('/')}
          className="w-full gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Inicio
        </Button>
      </Card>
    </div>
  );
}
