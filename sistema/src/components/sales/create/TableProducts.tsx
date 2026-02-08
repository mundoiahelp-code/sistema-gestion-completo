'use client';

import { Trash2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { IPhone } from '@/interfaces/schemas.interfaces';
import { useTranslation } from '@/i18n/I18nProvider';
import { translateColor } from '@/helpers/translateColor';

interface Props {
  items: IPhone[];
  onRemove?: (id: string) => void;
}

export default function TableProducts({ items, onRemove }: Props) {
  const { locale } = useTranslation();
  const isEnglish = locale === 'en';
  
  const isAccessory = (item: any) => item.category === 'ACCESSORY' || !item.imei;
  
  // iPhones = USD, Accesorios = ARS (fijo, sin selector)
  const getCurrency = (item: any) => isAccessory(item) ? 'ARS' : 'USD';

  return (
    <>
      <Table className='mt-4 border-b hidden md:table'>
        <TableHeader>
          <TableRow>
            <TableHead>{isEnglish ? 'Product' : 'Producto'}</TableHead>
            <TableHead>{isEnglish ? 'Details' : 'Detalles'}</TableHead>
            <TableHead>{isEnglish ? 'Qty.' : 'Cant.'}</TableHead>
            <TableHead>{isEnglish ? 'Price' : 'Precio'}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any, i) => (
            <TableRow key={i}>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {isAccessory(item) ? item.name : `${item.model} ${translateColor(item.color, locale)}`}
                  </p>
                  {item.imei && (
                    <p className="text-xs text-gray-400">{item.imei}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-gray-500">
                {isAccessory(item) 
                  ? (
                    <div>
                      <span>{item.model || '-'}</span>
                      {item.selectedStoreName && (
                        <p className="text-xs text-blue-500">{item.selectedStoreName}</p>
                      )}
                    </div>
                  )
                  : (item.battery ? `${item.battery}%` : '-')
                }
              </TableCell>
              <TableCell>{item.quantity || 1}</TableCell>
              <TableCell>
                <span className={`font-medium ${getCurrency(item) === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                  {getCurrency(item)} ${(item.price * (item.quantity || 1)).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}
                </span>
              </TableCell>
              <TableCell>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className='block md:hidden mt-4 rounded-lg'>
        {items.map((item: any, i) => (
          <div
            key={i}
            className='border p-2 text-sm mb-2 flex items-center justify-between'
          >
            <div>
              <p className='font-medium'>
                {isAccessory(item) ? item.name : `${item.model} ${translateColor(item.color, locale)}`}
                {!isAccessory(item) && item.battery && ` ${item.battery}%`}
              </p>
              {item.imei && <p className='text-gray-400 text-xs'>{item.imei}</p>}
              {isAccessory(item) && item.selectedStoreName && (
                <p className='text-blue-500 text-xs'>{item.selectedStoreName}</p>
              )}
              {item.quantity > 1 && <p className='text-gray-500'>x{item.quantity}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getCurrency(item) === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                {getCurrency(item)} ${(item.price * (item.quantity || 1)).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}
              </span>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.id)}
                  className="h-8 w-8 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
