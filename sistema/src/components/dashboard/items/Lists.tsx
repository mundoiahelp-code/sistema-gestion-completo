'use client';

import { TagIcon } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { useTranslation } from '@/i18n/I18nProvider';

export default function Lists() {
  const { t } = useTranslation();
  return (
    <Card className='bg-zinc-300'>
      <Link
        href={'/listados'}
        className='hover:underline flex items-center gap-2'
      >
        <TagIcon className='stroke-1 h-5 w-5' />
        {t('dashboard.viewWholesaleList')}
      </Link>
    </Card>
  );
}
