'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MonthComparisonProps {
  data: {
    currentMonth: { sales: number; revenue: number; month: string };
    lastMonth: { sales: number; revenue: number; month: string };
    percentageChange: number;
  };
}

export default function MonthComparison({ data }: MonthComparisonProps) {
  const { currentMonth, lastMonth, percentageChange } = data;
  
  const isPositive = percentageChange > 0;
  const isNeutral = percentageChange === 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
        Comparativa Mensual
      </h3>
      
      {/* Indicador principal */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          isPositive ? 'bg-green-500/10' : isNeutral ? 'bg-zinc-500/10' : 'bg-red-500/10'
        }`}>
          {isPositive ? (
            <TrendingUp className={`h-5 w-5 text-green-500`} />
          ) : isNeutral ? (
            <Minus className={`h-5 w-5 text-zinc-500`} />
          ) : (
            <TrendingDown className={`h-5 w-5 text-red-500`} />
          )}
        </div>
        <div>
          <div className={`text-2xl font-bold ${
            isPositive ? 'text-green-500' : isNeutral ? 'text-zinc-500' : 'text-red-500'
          }`}>
            {isPositive ? '+' : ''}{percentageChange}%
          </div>
          <div className="text-xs text-zinc-500">vs mes anterior</div>
        </div>
      </div>

      {/* Comparación lado a lado */}
      <div className="grid grid-cols-2 gap-4">
        {/* Mes actual */}
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mb-1">
            {currentMonth.month}
          </div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(currentMonth.revenue)}
          </div>
          <div className="text-xs text-zinc-500">
            {currentMonth.sales} ventas
          </div>
        </div>

        {/* Mes anterior */}
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mb-1">
            {lastMonth.month}
          </div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(lastMonth.revenue)}
          </div>
          <div className="text-xs text-zinc-500">
            {lastMonth.sales} ventas
          </div>
        </div>
      </div>
    </div>
  );
}
