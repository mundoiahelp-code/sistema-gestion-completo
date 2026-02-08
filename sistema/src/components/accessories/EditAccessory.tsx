'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit2Icon, Trash2Icon, LoaderCircleIcon, AlertTriangleIcon } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import useSonner from '@/hooks/useSonner';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  item: any;
  onUpdate: () => void;
}

export default function EditAccessory({ item, onUpdate }: Props) {
  const { t } = useTranslation();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({
    name: item.name || '',
    model: item.model || '',
    price: item.price?.toString() || '',
    cost: item.cost?.toString() || '',
    stock: item.stock?.toString() || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      await axios.put(
        `${API}/products/${item.id}`,
        {
          name: form.name,
          model: form.model,
          price: +form.price,
          cost: +form.cost,
          stock: +form.stock,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleSuccessSonner(t('editAccessory.updated'));
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating accessory:', error);
      handleErrorSonner(t('editAccessory.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      await axios.delete(`${API}/products/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleSuccessSonner(t('editAccessory.deleted'));
      setShowDeleteConfirm(false);
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting accessory:', error);
      handleErrorSonner(t('editAccessory.deleteError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit2Icon className="h-4 w-4 text-gray-500 hover:text-blue-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editAccessory.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">{t('editAccessory.name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('editAccessory.model')}</Label>
            <Input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">{t('editAccessory.price')}</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">{t('editAccessory.cost')}</Label>
              <Input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">{t('editAccessory.stock')}</Label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
          >
            <Trash2Icon className="h-4 w-4 mr-1" />
            {t('common.delete')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <LoaderCircleIcon className="animate-spin h-4 w-4" />
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-red-500" />
            {t('editAccessory.deleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('editAccessory.deleteConfirm')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-red-500 hover:bg-red-600" 
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            ) : (
              t('common.delete')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
