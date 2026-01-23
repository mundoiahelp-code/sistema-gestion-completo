'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface DolarData {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export default function DolarBlue() {
  const [dolar, setDolar] = useState<DolarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDolar = async () => {
    setLoading(true);
    setError(false);
    try {
      // DolarAPI.com - más actualizado y preciso
      const res = await fetch('https://dolarapi.com/v1/dolares/blue');
      if (!res.ok) throw new Error('Error fetching');
      const data = await res.json();
      setDolar({
        compra: data.compra,
        venta: data.venta,
        fechaActualizacion: data.fechaActualizacion,
      });
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDolar();
    const interval = setInterval(fetchDolar, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-zinc-700/50">
        <div className="flex items-center justify-between">
          <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">$ Dólar Blue</span>
          <button
            onClick={fetchDolar}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
        <span className="text-red-500 text-sm">Error al cargar</span>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-zinc-700/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">$ Dólar Blue</span>
        <button
          onClick={fetchDolar}
          disabled={loading}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !dolar ? (
        <div className="space-y-2">
          <div className="h-5 bg-slate-200/50 dark:bg-zinc-700/50 rounded animate-pulse" />
          <div className="h-5 bg-slate-200/50 dark:bg-zinc-700/50 rounded animate-pulse" />
        </div>
      ) : dolar ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">Compra</span>
              </div>
              <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                ${formatNumber(dolar.compra)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">Venta</span>
              </div>
              <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                ${formatNumber(dolar.venta)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-zinc-400 dark:text-zinc-500 text-xs">
            Actualizado {formatTime(dolar.fechaActualizacion)}
          </div>
        </>
      ) : null}
    </div>
  );
}
