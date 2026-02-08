'use client';

import { Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UpgradePromptProps {
  feature: string;
  description?: string;
}

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Crown className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Función Premium</h2>
        <p className="text-muted-foreground mb-6">
          {description || `${feature} está disponible en el plan Profesional.`}
        </p>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Plan Profesional</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Asistente de WhatsApp con IA</li>
            <li>✓ CRM completo</li>
            <li>✓ Turnos online automáticos</li>
            <li>✓ Integraciones</li>
            <li>✓ Usuarios ilimitados</li>
          </ul>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={() => window.open('https://Clodeb.store#planes', '_blank')}
        >
          <Crown className="h-4 w-4 mr-2" />
          Actualizar a Pro
        </Button>
      </Card>
    </div>
  );
}
