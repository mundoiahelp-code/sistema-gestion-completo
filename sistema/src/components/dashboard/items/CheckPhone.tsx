'use client';

import { PhoneIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useField from '@/hooks/useField';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';

export default function CheckPhone() {
  const { t } = useTranslation();
  const imei = useField({ type: 'text', validation: /^[0-9]*$/ });

  const router = useRouter();

  const handleSearch = () => {
    if (imei.value.length === 15) {
      router.push(`/productos/informacion/${imei.value}`);
    }
  };

  return (
    <Card className='bg-slate-300'>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant='link'
            className='flex items-center justify-start gap-2 p-0 text-md'
          >
            <PhoneIcon className='stroke-1 h-5 w-5 ' />
            <span>{t('dashboard.searchPhone')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>{t('dashboard.searchByImei')}</DialogHeader>
          <Input
            {...imei}
            placeholder='012345678901234'
            maxLength={15}
            className='md:w-1/2'
          />
          <DialogFooter>
            <Button onClick={handleSearch}>{t('common.search')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
