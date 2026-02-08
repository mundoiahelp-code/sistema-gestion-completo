'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { IDashboard } from '@/interfaces/dashboard.interface';
import DashboardTypes from './DasboardTypes';
import DashboardLoading from './DashboardLoading';

export default function Dashboard() {
  const [data, setData] = useState<IDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // El middleware ya verificó la autenticación, pero por si acaso
    const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
    
    if (!token) {
      // Redirigir silenciosamente al login
      window.location.href = '/iniciar-sesion';
      return;
    }

    console.log('Haciendo petición a:', `${API}/dashboard/stats`);
    
    axios.get(`${API}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log('Respuesta del backend:', res.data);
        const backendData = res.data;
        
        // Mapear ventas por mes
        const salesByMonth = (backendData.salesByMonth || []).map((item: any) => ({
          month: item.month, // Formato "2024-01"
          total: Number(item.total) || 0,
          count: Number(item.count) || 0,
        }));

        // Adaptar datos del backend al formato esperado por el frontend
        const adaptedData: IDashboard = {
          users: {
            admins: 0,
            vendors: 0,
            assistants: 0,
          },
          catalogue: {
            phones: backendData.totalStock || 0,
            lastOrders: backendData.lastOrders || [],
            totalAmount: backendData.capitalTotal || 0,
            totalReserved: backendData.totalReserved || 0,
            phonesStock: backendData.phonesStock || 0,
            accessoriesStock: backendData.accessoriesStock || 0,
            capitalIphones: backendData.capitalIphones || 0,
            capitalAccessories: backendData.capitalAccessories || 0,
          },
          sales: {
            clients: 0,
            totalSales: backendData.totalSales || 0,
            lastSales: backendData.lastSales || [],
            salesByMonth: salesByMonth,
            amountMonth: backendData.totalRevenue || 0,
            earningsUSD: backendData.profitUSD || 0, // Usar ganancia real (precio - costo)
            earningsARS: backendData.profitARS || 0, // Usar ganancia real (precio - costo)
          },
          salesSummary: backendData.salesSummary || {
            today: { count: 0, total: 0 },
            week: { count: 0, total: 0 },
            month: { count: 0, total: 0 }
          },
        };
        
        setData(adaptedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <DashboardLoading />;
  
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-500">
          No se pudieron cargar los datos. Verificá tu conexión.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return <DashboardTypes data={data} />;
}
