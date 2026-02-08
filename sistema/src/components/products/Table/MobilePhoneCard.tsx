'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Role } from '@/enums/role.enum';
import { IPhone } from '@/interfaces/schemas.interfaces';
import EditPhone from '../Edit/EditPhone';
import Info from './Info';
import { twMerge } from 'tailwind-merge';
import { ShoppingCartIcon, Battery, HardDrive, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/i18n/I18nProvider';
import { translateColor } from '@/helpers/translateColor';

interface Props {
  item: IPhone;
  role: string;
  index: number;
  handleDeletePhone: (id: string, i: number) => void;
  handleUpdate: (
    id: string,
    index: number,
    data: { [key: string]: string }
  ) => Promise<void>;
  models: { [key: string]: string[] };
  iphonesLS: { storages: string[]; colors: string[]; model: string }[];
  onReserveChange?: (id: string, reserved: boolean) => void;
}

export default function MobilePhoneCard({
  item,
  role,
  handleDeletePhone,
  index,
  handleUpdate,
  models,
  iphonesLS,
  onReserveChange,
}: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [isReserved, setIsReserved] = useState(item.reserved);
  const [showReservedAlert, setShowReservedAlert] = useState(false);

  const handleReserveChange = (id: string, reserved: boolean) => {
    setIsReserved(reserved);
    onReserveChange?.(id, reserved);
  };

  const handleQuickSell = () => {
    if (isReserved) {
      setShowReservedAlert(true);
    } else {
      proceedToSell();
    }
  };

  const proceedToSell = () => {
    localStorage.setItem('quickSellProduct', JSON.stringify(item));
    router.push('/ventas/crear');
  };

  return (
    <Card className={twMerge(
      'relative overflow-hidden',
      isReserved && 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
    )}>
      <CardContent className="p-4">
        {/* Header: Modelo, IMEI y Precio en una línea */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={twMerge(
              'font-bold text-base leading-tight mb-1',
              isReserved && 'text-green-600'
            )}>
              {item.model}
            </h3>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {item.imei}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={twMerge(
              'text-xl font-bold whitespace-nowrap',
              isReserved ? 'text-green-600' : 'text-green-700'
            )}>
              ${item.price}
            </span>
            {isReserved && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Reservado
              </span>
            )}
          </div>
        </div>

        {/* Specs en una fila compacta */}
        <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Palette className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={twMerge('font-medium', isReserved && 'text-green-600')}>
              {translateColor(item.color, locale) || '-'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <HardDrive className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={twMerge('font-medium', isReserved && 'text-green-600')}>
              {item.storage || '-'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Battery className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={twMerge('font-medium', isReserved && 'text-green-600')}>
              {item.battery}%
            </span>
          </div>
        </div>

        {/* Detalles si existen */}
        {item.details && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
            {item.details}
          </p>
        )}

        {/* Actions - Botones más grandes y táctiles */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <Info phone={{...item, reserved: isReserved}} onReserveChange={handleReserveChange} />
          <Button
            variant='ghost'
            size='sm'
            className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-9 w-9 p-0'
            onClick={handleQuickSell}
            title={t('products.sell')}
          >
            <ShoppingCartIcon className='h-5 w-5' />
          </Button>
          <EditPhone
            data={item}
            handleDelete={handleDeletePhone}
            handleEdit={handleUpdate}
            index={index}
            models={models}
            iphonesLS={iphonesLS}
          />
        </div>
      </CardContent>

      {/* Alert para producto reservado */}
      <AlertDialog open={showReservedAlert} onOpenChange={setShowReservedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.reservedProduct')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.reservedSellConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={proceedToSell}>
              {t('products.continueSale')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
