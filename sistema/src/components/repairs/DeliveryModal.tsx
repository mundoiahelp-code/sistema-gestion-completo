'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageCircle, Send, Wifi, WifiOff, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { useTranslation } from '@/i18n/I18nProvider';

interface Repair {
  id: string;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  issue: string;
  cost: number;
}

interface Store {
  id: string;
  name: string;
  address?: string;
}

interface DeliveryModalProps {
  open: boolean;
  onClose: () => void;
  repair: Repair;
  onConfirm: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DeliveryModal({
  open,
  onClose,
  repair,
  onConfirm,
}: DeliveryModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<{
    connected: boolean;
    qrCode: string | null;
  }>({ connected: false, qrCode: null });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    deliveryDate: '',
    deliveryTime: '',
    repairName: repair.issue,
    finalCost: repair.cost.toString(),
    storeId: '',
  });

  const getToken = () => {
    return Cookies.get('accessToken') || localStorage.getItem('accessToken') || Cookies.get('token') || localStorage.getItem('token');
  };

  // Cargar tiendas al abrir
  useEffect(() => {
    if (open) {
      checkWhatsAppStatus();
      loadStores();
    }
  }, [open]);

  const loadStores = async () => {
    try {
      const token = getToken();
      console.log('Loading stores, token:', token ? 'exists' : 'missing');
      const response = await fetch(`${API_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Stores response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Stores loaded:', data);
        const storesList = data.stores || data || [];
        setStores(storesList);
        if (storesList.length > 0 && !formData.storeId) {
          setFormData(prev => ({ ...prev, storeId: storesList[0].id }));
        }
      } else {
        console.error('Stores error:', await response.text());
      }
    } catch (err) {
      console.error('Error loading stores:', err);
    }
  };

  const checkWhatsAppStatus = async () => {
    setCheckingStatus(true);
    try {
      const token = getToken();
      console.log('Checking WhatsApp, token:', token ? 'exists' : 'missing');
      const response = await fetch(`${API_URL}/api/whatsapp/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('WhatsApp response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('WhatsApp status:', data);
        setWhatsappStatus({
          connected: data.connected,
          qrCode: data.qrCode,
        });
      } else {
        console.error('WhatsApp error:', await response.text());
      }
    } catch (err) {
      console.error('Error checking WhatsApp status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Polling para actualizar QR
  useEffect(() => {
    if (!open || whatsappStatus.connected) return;
    const interval = setInterval(checkWhatsAppStatus, 3000);
    return () => clearInterval(interval);
  }, [open, whatsappStatus.connected]);

  const getSelectedStore = () => stores.find(s => s.id === formData.storeId);

  const handleSendMessage = async () => {
    if (!formData.deliveryDate || !formData.deliveryTime || !formData.repairName) {
      setError(t('repairs.delivery.fillRequired'));
      return;
    }

    setLoading(true);
    setError('');

    const selectedStore = getSelectedStore();

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/whatsapp/send-repair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName: repair.clientName,
          clientPhone: repair.clientPhone,
          deviceModel: repair.deviceModel,
          repairName: formData.repairName,
          cost: formData.finalCost,
          deliveryDate: formData.deliveryDate,
          deliveryTime: formData.deliveryTime,
          office: selectedStore?.name || '',
          address: selectedStore?.address || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageSent(true);
        setSentMessage(data.message);
      } else {
        if (data.needsQR) {
          checkWhatsAppStatus();
        }
        setError(data.error || t('repairs.delivery.sendError'));
      }
    } catch (err) {
      setError(t('repairs.delivery.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t('repairs.delivery.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado WhatsApp */}
          <div className={`flex items-center gap-2 p-2 rounded-lg ${
            whatsappStatus.connected ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            {checkingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : whatsappStatus.connected ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="text-sm">
              {whatsappStatus.connected ? t('repairs.delivery.whatsappConnected') : t('repairs.delivery.whatsappDisconnected')}
            </span>
          </div>

          {/* QR Code si no está conectado */}
          {!whatsappStatus.connected && whatsappStatus.qrCode && (
            <div className="flex flex-col items-center p-4 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">{t('repairs.delivery.scanQR')}</p>
              <img src={whatsappStatus.qrCode} alt="QR WhatsApp" className="w-48 h-48" />
            </div>
          )}

          {/* Info del cliente */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm"><strong>{t('repairs.delivery.client')}:</strong> {repair.clientName}</p>
            <p className="text-sm"><strong>{t('repairs.delivery.phone')}:</strong> {repair.clientPhone}</p>
            <p className="text-sm"><strong>{t('repairs.delivery.device')}:</strong> {repair.deviceModel}</p>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('repairs.delivery.deliveryDate')}</Label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('repairs.delivery.deliveryTime')}</Label>
              <Input
                type="time"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>{t('repairs.delivery.repairDone')}</Label>
            <Input
              value={formData.repairName}
              onChange={(e) => setFormData({ ...formData, repairName: e.target.value })}
              placeholder={t('repairs.delivery.repairPlaceholder')}
            />
          </div>

          <div>
            <Label>{t('repairs.delivery.finalCost')}</Label>
            <Input
              type="number"
              value={formData.finalCost}
              onChange={(e) => setFormData({ ...formData, finalCost: e.target.value })}
            />
          </div>

          <div>
            <Label>{t('repairs.delivery.store')}</Label>
            <Select
              value={formData.storeId}
              onValueChange={(value) => setFormData({ ...formData, storeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('repairs.delivery.selectStore')} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name} {store.address && `- ${store.address}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Mensaje enviado */}
          {messageSent && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">✓ {t('repairs.delivery.messageSent')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sentMessage}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            
            {!messageSent ? (
              <Button
                onClick={handleSendMessage}
                disabled={loading || !whatsappStatus.connected || !formData.deliveryDate || !formData.deliveryTime}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {loading ? t('repairs.delivery.sending') : t('repairs.delivery.send')}
              </Button>
            ) : (
              <Button onClick={handleConfirmDelivery} className="flex-1">
                {t('repairs.delivery.confirmDelivery')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
