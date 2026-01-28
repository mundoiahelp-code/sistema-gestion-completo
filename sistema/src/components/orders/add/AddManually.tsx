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
    setError('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.replace(/\D/g, '').slice(0, 15);
      imei.onChange(cleanText);
      if (cleanText.length === 15) {
        setError('');
      }
    } catch (err) {
      console.error('Error al pegar:', err);
    }
  };

  return (
    <p className='text-center text-base text-zinc-400 font-light'>
      {isSpanish 
        ? 'PEscaneá el código de barras o agregá el producto manualmente haciendo '
        : 'To add a product enter its IMEI manually or with USB scanner by '}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger className='underline'>
          {isSpanish ? 'Click Aquí' : 'Clicking Here'}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            {isSpanish ? 'Agregar IMEI' : 'Add IMEI'}
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                {...imei}
                placeholder='012345678901234'
                maxLength={15}
                className='flex-1'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && imei.value.length === 15) {
                    handleAddManually();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={handlePaste}
                type="button"
              >
                📋
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {imei.value.length}/15 dígitos
            </p>
          </div>
          {error && <p className='text-sm text-red-600'>* {error}</p>}
          <DialogFooter>
            <Button 
              onClick={handleAddManually} 
              disabled={imei.value.length !== 15}
            >
              {isSpanish ? 'Agregar' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </p>
  );
}
