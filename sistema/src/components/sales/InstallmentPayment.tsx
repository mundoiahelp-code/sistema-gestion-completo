'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from '@/i18n/I18nProvider';

interface Installment {
  number: number;
  amount: number;
  dueDate: Date;
  paid: boolean;
  paidDate?: Date;
}

interface InstallmentPaymentProps {
  totalAmount: number;
  onConfirm: (installments: Installment[]) => void;
}

export default function InstallmentPayment({ totalAmount, onConfirm }: InstallmentPaymentProps) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const dateLocale = isSpanish ? es : enUS;
  
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const generateInstallments = () => {
    const amount = totalAmount / installmentCount;
    const newInstallments: Installment[] = [];
    
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      newInstallments.push({
        number: i + 1,
        amount: Math.round(amount),
        dueDate,
        paid: i === 0,
      });
    }
    
    setInstallments(newInstallments);
    setShowPreview(true);
  };

  const totalPaid = installments.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0);
  const totalPending = installments.filter(i => !i.paid).reduce((sum, i) => sum + i.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSpanish ? 'Sistema de Cuotas' : 'Installment Plan'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showPreview ? (
          <>
            <div>
              <Label>{isSpanish ? 'Monto Total' : 'Total Amount'}: ${totalAmount.toLocaleString()}</Label>
            </div>
            <div>
              <Label>{isSpanish ? 'Cantidad de Cuotas' : 'Number of Installments'}</Label>
              <Input
                type="number"
                min="2"
                max="12"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 2)}
              />
            </div>
            <Button onClick={generateInstallments} className="w-full">
              {isSpanish ? 'Generar Plan de Cuotas' : 'Generate Installment Plan'}
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{isSpanish ? 'Pagado' : 'Paid'}</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">${totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-400">{isSpanish ? 'Pendiente' : 'Pending'}</p>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-300">${totalPending.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              {installments.map((installment) => (
                <div
                  key={installment.number}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    installment.paid ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {installment.paid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600" />
                    )}
                    <div>
                      <p className="font-semibold dark:text-zinc-100">
                        {isSpanish ? 'Cuota' : 'Installment'} {installment.number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {isSpanish ? 'Vence' : 'Due'}: {format(installment.dueDate, 'dd/MM/yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${installment.amount.toLocaleString()}</p>
                    <Badge variant={installment.paid ? 'default' : 'secondary'}>
                      {installment.paid ? (isSpanish ? 'Pagada' : 'Paid') : (isSpanish ? 'Pendiente' : 'Pending')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                {isSpanish ? 'Modificar' : 'Modify'}
              </Button>
              <Button onClick={() => onConfirm(installments)} className="flex-1">
                {isSpanish ? 'Confirmar Venta en Cuotas' : 'Confirm Installment Sale'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
