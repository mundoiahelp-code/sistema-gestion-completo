'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';

export default function AddOrderBtn() {
  const router = useRouter();
  const { locale } = useTranslation();

  return (
    <Button className='w-full' onClick={() => router.push('/ingresos/cargar')}>
      {locale === 'es' ? 'Nuevo ingreso' : 'New Entry'}
    </Button>
  );
}
