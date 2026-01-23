'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

export default function AddSaleBtn() {
  const router = useRouter();
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';

  return (
    <Button className='w-full' onClick={() => router.push('/ventas/cargar')}>
      {isSpanish ? 'Cargar Venta' : 'Add Sale'}
    </Button>
  );
}
