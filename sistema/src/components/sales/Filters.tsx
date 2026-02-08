'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import useField from '@/hooks/useField';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  query: { [key: string]: string };
}

export default function Filters({ query }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const search = useField({ type: 'text', initialValue: query.search || query.clientName || '' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.value) {
      router.push(`/ventas?search=${search.value}`);
    }
  };

  const isFilters = Boolean(query.search || query.clientName || query.code);

  const resetFilters = () => {
    search.onChange('');
    router.push(`/ventas`);
  };

  return (
    <form onSubmit={handleSearch} className='flex gap-2'>
      <div className='relative flex-1'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        <Input
          {...search}
          placeholder={t('sales.searchClient')}
          className='pl-9 pr-8 bg-white dark:bg-zinc-900'
        />
        {isFilters && (
          <button
            type='button'
            onClick={resetFilters}
            className='absolute right-3 top-1/2 -translate-y-1/2'
          >
            <X className='h-4 w-4 text-gray-400 hover:text-gray-600' />
          </button>
        )}
      </div>
      <Button type='submit' size='sm'>
        {t('common.search')}
      </Button>
    </form>
  );
}
