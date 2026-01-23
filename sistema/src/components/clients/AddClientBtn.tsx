'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

export default function AddClientBtn() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Button className='w-full' onClick={() => router.push('/clientes/agregar')}>
      {t('common.addClient')}
    </Button>
  );
}
