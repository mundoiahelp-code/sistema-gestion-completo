'use client';

import { CalendarDays, TrendingUp, Calendar, CalendarRange } from 'lucide-react';

interface SalesSummaryData {
  today: { count: number; total: number };
  week: { count: number; total: number };
  month: { count: number; total: number };
}

interface Props {
  data: SalesSummaryData;
}

export default function SalesSummary({ data }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const items = [
    {
      label: 'Hoy',
      icon: CalendarDays,
      count: data.today.count,
      total: data.today.total,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Semana',
      icon: CalendarRange,
      count: data.week.count,
      total: data.week.total,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Mes',
      icon: Calendar,
      count: data.month.count,
      total: data.month.total,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-zinc-500" />
        <h3 className="font-semibold text-zinc-900 dark:text-white">Resumen de Ventas</h3>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-zinc-500">
                  {item.count} {item.count === 1 ? 'venta' : 'ventas'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${item.color}`}>
                {formatCurrency(item.total)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
