'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';

interface DollarConverterProps {
  totalUSD: number;
  onConvert: (amountARS: number) => void;
  isTransfer?: boolean;
}

export default function DollarConverter({ totalUSD, onConvert, isTransfer = false }: DollarConverterProps) {
  const { locale } = useTranslation();
  const [officialRate, setOfficialRate] = useState<number>(0);
  const [customRate, setCustomRate] = useState<string>('');
  const [transferFee, setTransferFee] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Obtener cotización del dólar
  const fetchDollarRate = async () => {
    setLoading(true);
    try {
      // API de dólar blue Argentina (puedes cambiar por otra API)
      const response = await fetch('https://dolarapi.com/v1/dolares/blue');
      const data = await response.json();
      
      if (data && data.venta) {
        setOfficialRate(data.venta);
        setCustomRate(data.venta.toString());
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching dollar rate:', error);
      // Valor por defecto si falla la API
      setOfficialRate(1200);
      setCustomRate('1200');
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDollarRate();
  }, []);

  const currentRate = parseFloat(customRate) || officialRate;
  const feePercentage = parseFloat(transferFee) || 0;
  
  // Calcular conversión
  const baseConversion = totalUSD * currentRate;
  const feeAmount = (baseConversion * feePercentage) / 100;
  const totalARS = baseConversion + feeAmount;

  // Auto-aplicar conversión cuando cambian los valores
  useEffect(() => {
    if (currentRate > 0 && totalUSD > 0) {
      onConvert(Math.round(totalARS));
    }
  }, [currentRate, feePercentage, totalUSD]);

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-sm">
            {locale === 'es' ? 'Conversor de Dólares' : 'Dollar Converter'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchDollarRate}
          disabled={loading}
          className="h-7 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {locale === 'es' ? 'Actualizar' : 'Refresh'}
        </Button>
      </div>

      {/* Cotización oficial */}
      <div className="mb-3 p-2 bg-white dark:bg-zinc-900 rounded-lg border">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>{locale === 'es' ? 'Cotización Blue Venta' : 'Blue Sell Rate'}</span>
          {lastUpdate && (
            <span className="text-[10px]">
              {lastUpdate.toLocaleTimeString(locale === 'es' ? 'es-AR' : 'en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
          ${officialRate.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}
        </div>
      </div>

      {/* Precio personalizado */}
      <div className="mb-3">
        <Label className="text-xs mb-1.5 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {locale === 'es' ? 'Tu Precio del Dólar' : 'Your Dollar Price'}
        </Label>
        <div className="relative">
          <span className="absolute text-sm top-2 left-3 text-gray-500">$</span>
          <Input
            type="number"
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value)}
            placeholder={officialRate.toString()}
            className="pl-7 h-9 text-sm font-medium"
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {locale === 'es' 
            ? 'Ajusta el precio según tu margen' 
            : 'Adjust the price according to your margin'}
        </p>
      </div>

      {/* Porcentaje de transferencia (solo si es transferencia) */}
      {isTransfer && (
        <div className="mb-3">
          <Label className="text-xs mb-1.5">
            {locale === 'es' ? '% Adicional por Transferencia' : 'Transfer Fee %'}
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={transferFee}
              onChange={(e) => setTransferFee(e.target.value)}
              placeholder="0"
              className="pr-7 h-9 text-sm"
              min="0"
              max="100"
              step="0.5"
            />
            <span className="absolute text-sm top-2 right-3 text-gray-500">%</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            {locale === 'es' 
              ? 'Ej: 2% por comisión bancaria' 
              : 'Ex: 2% for bank fee'}
          </p>
        </div>
      )}

      {/* Cálculo de conversión */}
      <div className="space-y-2 p-3 bg-white dark:bg-zinc-900 rounded-lg border">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            USD ${totalUSD.toLocaleString()} × ${currentRate.toLocaleString()}
          </span>
          <span className="font-medium">
            ${baseConversion.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        
        {isTransfer && feePercentage > 0 && (
          <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400">
            <span>+ {feePercentage}% {locale === 'es' ? 'comisión' : 'fee'}</span>
            <span className="font-medium">
              +${feeAmount.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400 pt-2 border-t">
          <span>{locale === 'es' ? 'Total en ARS' : 'Total in ARS'}</span>
          <span>
            ${totalARS.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 mt-2 text-center">
        {locale === 'es' 
          ? 'El monto se aplicará automáticamente al método de pago' 
          : 'Amount will be automatically applied to payment method'}
      </p>
    </Card>
  );
}
