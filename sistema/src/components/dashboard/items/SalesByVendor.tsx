'use client';

import { User, Trophy, Medal } from 'lucide-react';

interface VendorSale {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

interface SalesByVendorProps {
  data: VendorSale[];
}

export default function SalesByVendor({ data }: SalesByVendorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular el máximo para la barra de progreso
  const maxRevenue = Math.max(...data.map(v => v.revenue), 1);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-zinc-400" />;
    if (index === 2) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  const getBarColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-zinc-400';
    if (index === 2) return 'bg-amber-600';
    return 'bg-blue-500';
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
          Ventas por Vendedor
        </h3>
        <div className="text-center py-6 text-zinc-400">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin ventas este mes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Ventas por Vendedor
        </h3>
        <span className="text-xs text-zinc-400">Este mes</span>
      </div>
      
      <div className="space-y-3">
        {data.map((vendor, index) => (
          <div key={vendor.id || index} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getMedalIcon(index)}
                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[120px]">
                  {vendor.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(vendor.revenue)}
                </div>
                <div className="text-xs text-zinc-500">
                  {vendor.sales} {vendor.sales === 1 ? 'venta' : 'ventas'}
                </div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(index)} rounded-full transition-all duration-500`}
                style={{ width: `${(vendor.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total del equipo */}
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Total equipo</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {formatCurrency(data.reduce((acc, v) => acc + v.revenue, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
