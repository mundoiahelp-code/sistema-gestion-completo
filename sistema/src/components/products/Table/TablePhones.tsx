'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Role } from '@/enums/role.enum';
import { IPhone } from '@/interfaces/schemas.interfaces';
import Scan from './Scan';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import UseProducts from '@/hooks/useProduts';
import { copyStockMsg, copyModelsStock } from '@/helpers/copyStockMsg';
import useSonner from '@/hooks/useSonner';
import Filters from './Filters';
import PhoneRow from './PhoneRow';
import MobilePhoneCard from './MobilePhoneCard';
import useSelectIPhone from '@/hooks/useSelectIPhone';
import SearchImei from './SearchImei';
import { CopyIcon, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Props {
  data: IPhone[];
}

export default function TablePhones({ data }: Props) {
  const { role } = useGetUserInfo();
  const { t, locale } = useTranslation();
  const { handleSuccessSonner } = useSonner();
  const [exportLoading, setExportLoading] = useState(false);

  const { models, iphonesLS } = useSelectIPhone();

  const {
    items,
    handleDeletePhone,
    handleSearchImei,
    handleUpdate,
    handleRemoveImei,
    imeiUsed,
    handleReserveChange,
  } = UseProducts(data, locale);

  // Listener para scanner IMEI global
  useEffect(() => {
    const handleImeiScanned = (e: CustomEvent) => {
      const { imei } = e.detail;
      if (imei) {
        handleSearchImei(imei);
      }
    };
    
    window.addEventListener('imei-scanned-producto', handleImeiScanned as EventListener);
    return () => window.removeEventListener('imei-scanned-producto', handleImeiScanned as EventListener);
  }, [handleSearchImei]);

  // Exportar a Excel
  const handleExportExcel = () => {
    setExportLoading(true);
    try {
      const excelData = items.map((phone) => ({
        'IMEI': phone.imei || '',
        'Modelo': phone.model || '',
        'Color': phone.color || '',
        'Almacenamiento': phone.storage || '',
        'Batería': phone.battery ? `${phone.battery}%` : '',
        'Precio': phone.price || 0,
        'Costo': phone.cost || 0,
        'Reservado': phone.reserved ? 'Sí' : 'No',
        'Sucursal': phone.store?.name || '',
        'Detalles': phone.details || '',
        'Fecha Ingreso': phone.createdAt ? new Date(phone.createdAt).toLocaleDateString('es-AR') : ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos
      ws['!cols'] = [
        { wch: 18 }, // IMEI
        { wch: 15 }, // Modelo
        { wch: 12 }, // Color
        { wch: 15 }, // Almacenamiento
        { wch: 10 }, // Batería
        { wch: 12 }, // Precio
        { wch: 12 }, // Costo
        { wch: 10 }, // Reservado
        { wch: 20 }, // Sucursal
        { wch: 30 }, // Detalles
        { wch: 12 }  // Fecha
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Celulares');
      
      const filename = `celulares_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`${items.length} celulares exportados`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div>
      <Filters />
      <div className="flex gap-2 items-center">
        <Scan onChange={handleSearchImei} />
      </div>
      <div className='w-full my-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
        <div className='flex gap-4 text-xs sm:text-sm'>
          <p className='font-medium'>{t('products.units')}: {items.reduce((acc, item) => acc + (item.stock || 1), 0)}</p>
          <p className='font-medium'>{t('products.reserved')}: <span className='text-green-600'>{items.filter(item => item.reserved).length}</span></p>
        </div>
        <div className='flex items-center gap-1 flex-wrap'>
          {locale === 'es' && (
            <Button
              size='sm'
              variant='outline'
              onClick={handleExportExcel}
              disabled={exportLoading || items.length === 0}
            >
              {exportLoading ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                <FileSpreadsheet className='h-4 w-4' />
              )}
              <span className='hidden sm:inline ml-1'>Excel</span>
            </Button>
          )}
          <Button
            size='sm'
            onClick={() => {
              const text = copyStockMsg(items, locale);
              navigator.clipboard.writeText(text);
              handleSuccessSonner(t('notifications.copied'));
            }}
          >
            <CopyIcon className='stroke-1 h-4 w-4' />
            <span className='hidden sm:inline ml-1'>{t('products.copyStock')}</span>
          </Button>
          <Button
            size='sm'
            onClick={() => {
              const text = copyModelsStock(items, locale);
              navigator.clipboard.writeText(text);
              handleSuccessSonner(t('notifications.copied'));
            }}
          >
            <CopyIcon className='stroke-1 h-4 w-4' />
            <span className='hidden sm:inline ml-1'>{t('products.copyModels')}</span>
          </Button>
        </div>
      </div>
      <SearchImei
        searchImei={handleSearchImei}
        imeiUsed={imeiUsed}
        deleteImei={handleRemoveImei}
      />
      {items.length > 0 ? (
        <div className='rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800 md:overflow-visible overflow-x-auto'>
          <Table className='w-full md:min-w-0 min-w-[900px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='whitespace-nowrap'>{t('products.imei')}</TableHead>
                <TableHead className='whitespace-nowrap'>{t('products.model')}</TableHead>
                <TableHead className='whitespace-nowrap'>{t('products.color')}</TableHead>
                <TableHead className='whitespace-nowrap'>{t('products.storage')}</TableHead>
                <TableHead className='whitespace-nowrap'>{t('products.battery')}</TableHead>
                <TableHead className='whitespace-nowrap'>{t('products.price')}</TableHead>
                <TableHead className='whitespace-nowrap'>{t('common.details')}</TableHead>
                <TableHead>
                  <span className='sr-only'>info</span>
                </TableHead>
                <TableHead>
                  <span className='sr-only'>{t('products.sell')}</span>
                </TableHead>
                <TableHead>
                  <span className='sr-only'>{t('common.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <PhoneRow
                  key={i}
                  handleDeletePhone={handleDeletePhone}
                  index={i}
                  item={item}
                  role={role}
                  handleUpdate={handleUpdate}
                  models={models}
                  iphonesLS={iphonesLS}
                  onReserveChange={handleReserveChange}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className='w-full text-center py-4'>
          <p className='text-gray-500 dark:text-gray-400'>{t('common.noResults')}</p>
        </div>
      )}
    </div>
  );
}
