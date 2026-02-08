import { InfoIcon, LoaderCircleIcon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IPhone } from '@/interfaces/schemas.interfaces';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import axios, { AxiosRequestConfig } from 'axios';
import useCookie from '@/hooks/useCookie';
import { API } from '@/config/api';
import useSonner from '@/hooks/useSonner';
import { useRouter } from 'next/navigation';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';
import Link from 'next/link';
import { useTranslation } from '@/i18n/I18nProvider';
import { translateColor } from '@/helpers/translateColor';

interface Props {
  phone: IPhone;
  onReserveChange?: (id: string, reserved: boolean) => void;
}

export default function Info({ phone, onReserveChange }: Props) {
  const { t, locale } = useTranslation();
  const { role } = useGetUserInfo();
  const [accessToken, setAccessToken] = useCookie('accessToken', false);
  const { handleErrorSonner, handleSuccessSonner } = useSonner();
  const router = useRouter();

  const [isReserved, setIsReserved] = useState(phone.reserved);
  const [loading, setLoading] = useState(false);

  const items = [
    { name: t('products.imei'), value: phone.imei },
    { name: t('products.model'), value: phone.model },
    { name: t('products.color'), value: translateColor(phone.color, locale) },
    { name: t('products.storage'), value: phone.storage },
    { name: t('products.battery'), value: `${phone.battery}%` },
    { name: t('common.price'), value: `${phone.price}` },
    { name: t('common.details'), value: phone.details ? phone.details : '-' },
  ];

  const handleReserve = () => {
    const config: AxiosRequestConfig = {
      url: `${API}/products/reserve/${phone.id}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    setLoading(true);
    axios(config)
      .then(() => {
        handleSuccessSonner(t('notifications.updated'));
        const newReserved = !isReserved;
        setIsReserved(newReserved);
        phone.reserved = newReserved;
        onReserveChange?.(phone.id, newReserved);
        router.refresh();
      })
      .catch((err) => {
        console.log(err);
        handleErrorSonner(t('errors.generic'));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <InfoIcon className='stroke-1 h-5 w-5 cursor-pointer hover:opacity-80' />
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('common.info')}</DialogTitle>
        </DialogHeader>
        <div>
          <ul className=''>
            {items.map((item, i) => (
              <li key={i} className='mb-2'>
                <span className='text-sm font-semibold'>{item.name}: </span>
                <span>{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className='flex mt-3 justify-between items-center'>
          <Link
            href={`/productos/informacion/${phone.imei}`}
            className='text-sm border px-2 py-1 text-gray-700 transition-colors border-gray-500 rounded-md hover:border-black hover:text-black'
          >
            {t('products.viewMoreDetails')}
          </Link>
          <Button
            onClick={handleReserve}
            disabled={loading}
            className={twMerge(
              isReserved
                ? 'bg-red-900 hover:bg-red-900'
                : 'bg-green-900 hover:bg-green-900',
              'hover:opacity-90'
            )}
          >
            {loading ? (
              <LoaderCircleIcon className='animate-spin' />
            ) : (
              <>{isReserved ? t('products.cancelReservation') : t('products.reserve')}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
