import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useField from '@/hooks/useField';
import { useTranslation } from '@/i18n/I18nProvider';

interface Prop {
  handleAddItem: (imei: string) => void;
  loading: boolean;
}

export default function AddManually({ handleAddItem, loading }: Prop) {
  const { t, locale } = useTranslation();
  const imei = useField({ type: 'text' });

  const [openDialog, setOpenDialog] = useState(false);

  const [error, setError] = useState('');

  const handleAddManually = () => {
    if (loading) return;

    if (imei.value.length !== 15) {
      return setError(locale === 'es' ? 'El IMEI debe tener 15 dígitos' : 'IMEI must be 15 digits');
    }

    handleAddItem(imei.value);
    setOpenDialog(false);
    imei.onChange('');
  };

  return (
    <p className='text-center text-base text-zinc-400 font-light'>
      {locale === 'es' 
        ? 'Para agregar un producto escanea su IMEI o manualmente haciendo ' 
        : 'To add a product scan its IMEI or manually by '}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger className='underline'>
          {locale === 'es' ? 'Click Aquí' : 'Clicking Here'}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            {locale === 'es' ? 'Agregar IMEI manualmente' : 'Add IMEI Manually'}
          </DialogHeader>
          <Input
            {...imei}
            placeholder='012345678901234'
            maxLength={15}
            className='md:w-1/2'
          />
          {error && <p className='text-sm text-red-600'>* {error}</p>}
          <DialogFooter>
            <Button onClick={handleAddManually}>{t('common.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </p>
  );
}
