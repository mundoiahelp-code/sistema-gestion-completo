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
  const { t } = useTranslation();
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
      'relative',
      isReserved && 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
    )}>
      <CardContent className="pt-3 pb-3 px-3">
        {/* Header: Modelo y Precio */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className={twMerge(
              'font-semibold text-sm',
              isReserved && 'text-green-600'
            )}>
              {item.model}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {item.imei}
            </p>
          </div>
          <span className={twMerge(
            'text-lg font-bold',
            isReserved ? 'text-green-600' : 'text-green-700'
          )}>
            ${item.price}
          </span>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Palette className="h-3 w-3" />
            <span className={isReserved ? 'text-green-600' : ''}>{item.color || '-'}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <HardDrive className="h-3 w-3" />
            <span className={isReserved ? 'text-green-600' : ''}>{item.storage || '-'}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Battery className="h-3 w-3" />
            <span className={isReserved ? 'text-green-600' : ''}>{item.battery}%</span>
          </div>
        </div>

        {/* Detalles si existen */}
        {item.details && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {item.details}
          </p>
        )}

        {/* Reservado badge */}
        {isReserved && (
          <div className="mb-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Reservado
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-1 pt-2 border-t">
          <Info phone={{...item, reserved: isReserved}} onReserveChange={handleReserveChange} />
          <Button
            variant='ghost'
            size='sm'
            className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8 p-0'
            onClick={handleQuickSell}
            title={t('products.sell')}
          >
            <ShoppingCartIcon className='h-4 w-4' />
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
