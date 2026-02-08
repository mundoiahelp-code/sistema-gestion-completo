'use client';

import { Trash2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

import { useTranslation } from '@/i18n/I18nProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { API } from '@/config/api';
import useSonner from '@/hooks/useSonner';

interface Props {
  id: string;
  onDeleted?: () => void;
}

export default function DeleteUser({ id, onDeleted }: Props) {
  const { handleErrorSonner, handleSuccessSonner } = useSonner();
  const { t, locale } = useTranslation();

  const handleDelete = async () => {
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.message) {
        handleSuccessSonner(locale === 'es' ? 'Usuario eliminado correctamente' : 'User deleted successfully');
        onDeleted?.();
      } else if (res.data.error) {
        handleErrorSonner(res.data.error);
      }
    } catch (err: any) {
      handleErrorSonner(err.response?.data?.error || (locale === 'es' ? 'Error al eliminar usuario' : 'Error deleting user'));
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem 
          onSelect={(e) => e.preventDefault()}
          className='text-destructive focus:text-destructive cursor-pointer'
        >
          <Trash2 className='h-4 w-4 mr-2' />
          {locale === 'es' ? 'Eliminar usuario' : 'Delete user'}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('users.deleteConfirm')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {locale === 'es' 
              ? 'Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema y perderá acceso inmediatamente.'
              : 'This action cannot be undone. The user will be permanently deleted from the system and will lose access immediately.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
