'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/I18nProvider';

export default function EmptyRequest() {
  const { t } = useTranslation();
  return (
    <div className='flex items-center justify-center'>
      <div className='flex flex-col gap-2'>
        <p className='text-2xl font-light text-slate-800'>
          {t('common.noResults')}
        </p>
        <div className='text-center'>
          <Link href={'/'} className='text-black hover:underline'>
            {t('common.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
