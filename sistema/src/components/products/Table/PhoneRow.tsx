import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Role } from '@/enums/role.enum';
import { IPhone } from '@/interfaces/schemas.interfaces';
import EditPhone from '../Edit/EditPhone';
import Info from './Info';
import { twMerge } from 'tailwind-merge';
import { ShoppingCartIcon } from 'lucide-react';
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

export default function PhoneRow({
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
    // Notificar al padre para actualizar el contador
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
    // Guardar el producto en localStorage para cargarlo en ventas
    localStorage.setItem('quickSellProduct', JSON.stringify(item));
    router.push('/ventas/crear');
  };

  const textColor = isReserved ? 'text-green-500' : '';

  return (
    <TableRow>
      <TableCell
        className={twMerge(
          isReserved ? 'text-green-500' : 'text-gray-500',
          'text-xs whitespace-nowrap'
        )}
      >
        {item.imei}
      </TableCell>
      <TableCell className={twMerge('whitespace-nowrap text-xs sm:text-sm', textColor)}>{item.model}</TableCell>
      <TableCell className={twMerge('whitespace-nowrap', textColor)}>{translateColor(item.color, locale)}</TableCell>
      <TableCell className={twMerge('', textColor)}>{item.storage}</TableCell>
      <TableCell className={twMerge('', textColor)}>{item.battery}%</TableCell>
      <TableCell
        className={twMerge(
          isReserved ? 'text-green-500' : 'text-green-700 font-semibold',
          'whitespace-nowrap'
        )}
      >
        ${item.price}
      </TableCell>
      <TableCell className={twMerge('max-w-[100px] overflow-hidden whitespace-nowrap text-ellipsis', textColor)}>
        {item.details ? item.details : '-'}
      </TableCell>
      <TableCell>
        <Info phone={{...item, reserved: isReserved}} onReserveChange={handleReserveChange} />
      </TableCell>
      <TableCell>
        <Button
          variant='ghost'
          size='sm'
          className='text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          onClick={handleQuickSell}
          title={t('products.sell')}
        >
          <ShoppingCartIcon className='h-4 w-4' />
        </Button>
      </TableCell>
      <TableCell>
        <EditPhone
          data={item}
          handleDelete={handleDeletePhone}
          handleEdit={handleUpdate}
          index={index}
          models={models}
          iphonesLS={iphonesLS}
        />
      </TableCell>

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
    </TableRow>
  );
}
