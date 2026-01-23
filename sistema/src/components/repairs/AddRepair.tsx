'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/i18n/I18nProvider';
import axios from 'axios';
import { API } from '@/config/api';

interface AddRepairProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRepair({ open, onClose, onSuccess }: AddRepairProps) {
  const [loading, setLoading] = useState(false);
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    deviceModel: '',
    devicePassword: '',
    issue: '',
    cost: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newRepair = {
        id: Date.now().toString(),
        ...formData,
        cost: parseFloat(formData.cost),
        status: 'received' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await axios.post(`${API}/repairs`, newRepair);
      } catch (error) {
        // Si falla el backend, guardar en localStorage
        const localRepairs = JSON.parse(localStorage.getItem('repairs') || '[]');
        localRepairs.push(newRepair);
        localStorage.setItem('repairs', JSON.stringify(localRepairs));
      }

      onSuccess();
      onClose();
      setFormData({
        clientName: '',
        clientPhone: '',
        deviceModel: '',
        devicePassword: '',
        issue: '',
        cost: '',
      });
    } catch (error) {
      console.error('Error creating repair:', error);
      alert(locale === 'es' ? 'Error al crear la reparación' : 'Error creating repair');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('repairs.newRepair')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{locale === 'es' ? 'Nombre del Cliente' : 'Client Name'} *</Label>
            <Input
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('common.phone')} *</Label>
            <Input
              required
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('repairs.deviceModel')} *</Label>
            <Input
              required
              value={formData.deviceModel}
              onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
              placeholder={locale === 'es' ? 'Ej: iPhone 15 Pro' : 'Ex: iPhone 15 Pro'}
            />
          </div>
          <div>
            <Label>{locale === 'es' ? 'Clave del Celular (opcional)' : 'Device Password (optional)'}</Label>
            <Input
              value={formData.devicePassword}
              onChange={(e) => setFormData({ ...formData, devicePassword: e.target.value })}
              placeholder={locale === 'es' ? 'Ej: 1234 o patrón' : 'Ex: 1234 or pattern'}
            />
          </div>
          <div>
            <Label>{locale === 'es' ? 'Problema/Falla' : 'Issue/Problem'} *</Label>
            <Textarea
              required
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder={locale === 'es' ? 'Describe el problema...' : 'Describe the issue...'}
            />
          </div>
          <div>
            <Label>{t('repairs.cost')} *</Label>
            <Input
              required
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (locale === 'es' ? 'Guardando...' : 'Saving...') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
