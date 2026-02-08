'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';
import AddRepair from './AddRepair';
import DeliveryModal from './DeliveryModal';

interface Repair {
  id: string;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  issue: string;
  status: 'received' | 'in_progress' | 'ready' | 'delivered';
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export default function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deliveryRepair, setDeliveryRepair] = useState<Repair | null>(null);
  const { t, locale } = useTranslation();

  const statusLabels = {
    received: locale === 'es' ? 'Recibido' : 'Received',
    in_progress: locale === 'es' ? 'En Proceso' : 'In Progress',
    ready: locale === 'es' ? 'Listo' : 'Ready',
    delivered: locale === 'es' ? 'Entregado' : 'Delivered',
  };

  const statusColors = {
    received: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const token = Cookies.get('accessToken');
      // Intentar obtener del backend
      const res = await axios.get(`${API}/repairs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRepairs(res.data.repairs || []);
    } catch (error) {
      console.error('Error fetching repairs:', error);
      // Si falla, usar localStorage
      const localRepairs = localStorage.getItem('repairs');
      if (localRepairs) {
        setRepairs(JSON.parse(localRepairs));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Repair['status']) => {
    try {
      const token = Cookies.get('accessToken');
      await axios.put(`${API}/repairs/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRepairs();
    } catch (error) {
      console.error('Error updating repair:', error);
      // Actualizar localmente
      const updatedRepairs = repairs.map(r => 
        r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
      );
      setRepairs(updatedRepairs);
      localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
    }
  };

  const handleDeliveryClick = (repair: Repair) => {
    setDeliveryRepair(repair);
  };

  const handleConfirmDelivery = () => {
    if (deliveryRepair) {
      handleStatusChange(deliveryRepair.id, 'delivered');
      setDeliveryRepair(null);
    }
  };

  const groupedRepairs = {
    received: repairs.filter(r => r.status === 'received'),
    in_progress: repairs.filter(r => r.status === 'in_progress'),
    ready: repairs.filter(r => r.status === 'ready'),
    delivered: repairs.filter(r => r.status === 'delivered'),
  };

  if (loading) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">{locale === 'es' ? 'Servicio Técnico' : 'Repair Service'}</h1>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {t('repairs.newRepair')}
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recibido */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="font-semibold text-base md:text-lg flex items-center gap-2">
            <Badge className={statusColors.received}>
              {statusLabels.received} ({groupedRepairs.received.length})
            </Badge>
          </h2>
          {groupedRepairs.received.map((repair) => (
            <Card key={repair.id}>
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="text-sm">{repair.deviceModel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 md:space-y-2 px-3 md:px-6 pb-3 md:pb-6">
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Cliente' : 'Client'}:</strong> {repair.clientName}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Tel' : 'Phone'}:</strong> {repair.clientPhone}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Problema' : 'Issue'}:</strong> {repair.issue}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Costo' : 'Cost'}:</strong> ${repair.cost.toLocaleString()}</p>
                <Button 
                  size="sm" 
                  className="w-full mt-2 text-xs md:text-sm"
                  onClick={() => handleStatusChange(repair.id, 'in_progress')}
                >
                  {t('repairs.actions.startRepair')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* En Proceso */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="font-semibold text-base md:text-lg flex items-center gap-2">
            <Badge className={statusColors.in_progress}>
              {statusLabels.in_progress} ({groupedRepairs.in_progress.length})
            </Badge>
          </h2>
          {groupedRepairs.in_progress.map((repair) => (
            <Card key={repair.id}>
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="text-sm">{repair.deviceModel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 md:space-y-2 px-3 md:px-6 pb-3 md:pb-6">
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Cliente' : 'Client'}:</strong> {repair.clientName}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Tel' : 'Phone'}:</strong> {repair.clientPhone}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Problema' : 'Issue'}:</strong> {repair.issue}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Costo' : 'Cost'}:</strong> ${repair.cost.toLocaleString()}</p>
                <Button 
                  size="sm" 
                  className="w-full mt-2 text-xs md:text-sm"
                  onClick={() => handleStatusChange(repair.id, 'ready')}
                >
                  {t('repairs.actions.markReady')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listo */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="font-semibold text-base md:text-lg flex items-center gap-2">
            <Badge className={statusColors.ready}>
              {statusLabels.ready} ({groupedRepairs.ready.length})
            </Badge>
          </h2>
          {groupedRepairs.ready.map((repair) => (
            <Card key={repair.id}>
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="text-sm">{repair.deviceModel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 md:space-y-2 px-3 md:px-6 pb-3 md:pb-6">
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Cliente' : 'Client'}:</strong> {repair.clientName}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Tel' : 'Phone'}:</strong> {repair.clientPhone}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Problema' : 'Issue'}:</strong> {repair.issue}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Costo' : 'Cost'}:</strong> ${repair.cost.toLocaleString()}</p>
                <Button 
                  size="sm" 
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs md:text-sm"
                  onClick={() => handleDeliveryClick(repair)}
                >
                  📱 {t('repairs.actions.deliver')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Entregado */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="font-semibold text-base md:text-lg flex items-center gap-2">
            <Badge className={statusColors.delivered}>
              {statusLabels.delivered} ({groupedRepairs.delivered.length})
            </Badge>
          </h2>
          {groupedRepairs.delivered.map((repair) => (
            <Card key={repair.id} className="opacity-60">
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="text-sm">{repair.deviceModel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 md:space-y-2 px-3 md:px-6 pb-3 md:pb-6">
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Cliente' : 'Client'}:</strong> {repair.clientName}</p>
                <p className="text-xs md:text-sm"><strong>{locale === 'es' ? 'Costo' : 'Cost'}:</strong> ${repair.cost.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{statusLabels.delivered}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddRepair 
          open={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={fetchRepairs}
        />
      )}

      {deliveryRepair && (
        <DeliveryModal
          open={!!deliveryRepair}
          onClose={() => setDeliveryRepair(null)}
          repair={deliveryRepair}
          onConfirm={handleConfirmDelivery}
        />
      )}
    </div>
  );
}
