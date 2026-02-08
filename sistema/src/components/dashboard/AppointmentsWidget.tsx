'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';

interface AppointmentStats {
  today: number;
  thisWeek: number;
  confirmed: number;
  pending: number;
}

export default function AppointmentsWidget() {
  const [stats, setStats] = useState<AppointmentStats>({
    today: 0,
    thisWeek: 0,
    confirmed: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = Cookies.get('token');
      const today = new Date().toISOString().split('T')[0];

      // Obtener turnos de hoy
      const todayResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/today`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const todayAppointments = todayResponse.data || [];

      setStats({
        today: todayAppointments.length,
        thisWeek: todayAppointments.length, // Simplificado
        confirmed: todayAppointments.filter((a: any) => a.status === 'CONFIRMED').length,
        pending: todayAppointments.filter((a: any) => a.status === 'PENDING').length,
      });
    } catch (error) {
      console.error('Error cargando estadísticas de turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Turnos</h3>
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>

        <div className="space-y-4">
          {/* Turnos de hoy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
              <span className="text-sm text-gray-600 dark:text-zinc-400">Hoy</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{stats.today}</span>
          </div>

          {/* Confirmados */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-zinc-400">Confirmados</span>
            </div>
            <span className="text-lg font-semibold text-green-600">{stats.confirmed}</span>
          </div>

          {/* Pendientes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-zinc-400">Pendientes</span>
            </div>
            <span className="text-lg font-semibold text-yellow-600">{stats.pending}</span>
          </div>
        </div>

        {/* Botón para ver todos */}
        <Link
          href="/turnos"
          className="mt-4 block w-full text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
        >
          Ver todos los turnos
        </Link>
      </div>

      {/* Indicador de actualización en tiempo real */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700 rounded-b-lg">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-zinc-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Actualización en tiempo real</span>
        </div>
      </div>
    </div>
  );
}
