'use client';

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

interface Props {
  addOne: (imei: string) => void;
}

export default function AddManually({ addOne }: Props) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const imei = useField({ type: 'text', validation: /^[0-9]*$/ });

  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');

  const handleAddManually = () => {
    if (imei.value.length !== 15) {
      return setError(isSpanish ? 'El IMEI debe tener 15 dígitos' : 'IMEI must have 15 digits');
    }

    addOne(imei.value);
    setOpenDialog(false);
    imei.onChange('');
  };

  return (
    <p className='text-center text-base text-zinc-400 font-light'>
      {isSpanish 
        ? 'Para agregar un producto escanea su IMEI o manualmente haciendo '
        : 'To add a product scan its IMEI or manually by '}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger className='underline'>
          {isSpanish ? 'Click Aquí' : 'Clicking Here'}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            {isSpanish ? 'Agregar IMEI manualmente' : 'Add IMEI Manually'}
          </DialogHeader>
          <Input
            {...imei}
            placeholder='012345678901234'
            maxLength={15}
            className='md:w-1/2'
          />
          {error && <p className='text-sm text-red-600'>* {error}</p>}
          <DialogFooter>
            <Button onClick={handleAddManually}>
              {isSpanish ? 'Agregar' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </p>
  );
}
