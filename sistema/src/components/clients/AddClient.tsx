'use client';

import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';

export default function AddClient() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dni: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = Cookies.get('accessToken');
    try {
      await axios.post(`${API}/clients`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        dni: '',
      });
      router.refresh();
    } catch (error) {
      console.error('Error creating client:', error);
      alert(t('addClient.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('addClient.addClient')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addClient.newClient')}</DialogTitle>
          <DialogDescription>
            {t('addClient.fillData')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('addClient.name')} *</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('addClient.email')}</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('addClient.phone')}</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('addClient.dni')}</Label>
            <Input
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('addClient.address')}</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('addClient.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
