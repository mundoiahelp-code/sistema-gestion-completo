'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

export default function AddUserBtn() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Button onClick={() => router.push('/usuarios/agregar')}>
      {t('common.addUser')}
    </Button>
  );
}
