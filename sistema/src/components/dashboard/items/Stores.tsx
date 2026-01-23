'use client';

import { StoreIcon } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { useTranslation } from '@/i18n/I18nProvider';

export default function Stores() {
  const { t } = useTranslation();
  return (
    <Card className='bg-zinc-300'>
      <Link
        href={'/tiendas'}
        className='hover:underline flex items-center gap-2'
      >
        <StoreIcon className='stroke-1 h-5 w-5' />
        <span>{t('nav.stores')}</span>
      </Link>
    </Card>
  );
}
