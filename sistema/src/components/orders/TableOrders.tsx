'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/helpers/formatDate';
import usePagination from '@/hooks/usePagination';
import { IOrder } from '@/interfaces/schemas.interfaces';
import Pagination from '../common/Pagination';
import { useTranslation } from '@/i18n/I18nProvider';
import { SmartphoneIcon, HeadphonesIcon, PackageIcon, FileSpreadsheet, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Props {
  data: (IOrder & { category?: string })[];
  pagination: {
    page: number;
    total: number;
    perPage: number;
    from: number;
    to: number;
  };
  query: { [key: string]: string };
}

const CategoryBadge = ({ category, locale }: { category?: string; locale: string }) => {
  if (category === 'PHONE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <SmartphoneIcon className="h-3 w-3" />
        {locale === 'es' ? 'Celular' : 'Phone'}
      </span>
    );
  }
  if (category === 'ACCESSORY') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <HeadphonesIcon className="h-3 w-3" />
        {locale === 'es' ? 'Accesorio' : 'Accessory'}
      </span>
    );
  }
  if (category === 'MIXED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <PackageIcon className="h-3 w-3" />
        {locale === 'es' ? 'Mixto' : 'Mixed'}
      </span>
    );
  }
  return <span className="text-gray-400">-</span>;
};

export default function TableOrders({ data, pagination, query }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [exportLoading, setExportLoading] = useState(false);

  const { nextPage, previousPage } = usePagination('/ingresos', query);

  // Exportar a Excel
  const handleExportExcel = () => {
    setExportLoading(true);
    try {
      const excelData = data.map((order) => ({
        'Código': order.code || order.id?.slice(-6).toUpperCase(),
        'Categoría': order.category === 'PHONE' ? 'Celular' : order.category === 'ACCESSORY' ? 'Accesorio' : 'Mixto',
        'Cantidad de Items': order.totalItems || order.items?.length || 0,
        'Vendedor': order.user?.name || order.vendor || 'Sin asignar',
        'Fecha': order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : '',
        'Hora': order.createdAt ? new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '',
        'Notas': order.notes || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos
      ws['!cols'] = [
        { wch: 12 }, // Código
        { wch: 15 }, // Categoría
        { wch: 15 }, // Cantidad
        { wch: 20 }, // Vendedor
        { wch: 12 }, // Fecha
        { wch: 8 },  // Hora
        { wch: 40 }  // Notas
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
      
      const filename = `ingresos_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`${data.length} ingresos exportados`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Card className='lg:col-span-3 order-last lg:order-first'>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('nav.inventory')}</CardTitle>
            <CardDescription>{locale === 'es' ? 'Lista de todos los ingresos.' : 'List of all inventory entries.'}</CardDescription>
          </div>
          {locale === 'es' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportLoading || data.length === 0}
            >
              {exportLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">Excel</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pagination.total === 0 ? (
          <p className='text-center text-slate-400'>
            {t('common.noResults')}
          </p>
        ) : (
          <div className="md:overflow-visible overflow-x-auto">
            <Table className="w-full md:min-w-0 min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">#</TableHead>
                  <TableHead className="whitespace-nowrap">{locale === 'es' ? 'Categoría' : 'Category'}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('products.units')}</TableHead>
                  <TableHead className="whitespace-nowrap">{locale === 'es' ? 'Vendedor' : 'Seller'}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('common.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((order) => (
                  <TableRow
                    key={order.id}
                    onClick={() => router.push(`/ingresos/${order.id}`)}
                    className='cursor-pointer'
                  >
                    <TableCell className="whitespace-nowrap">#{order.code || order.id?.slice(-6).toUpperCase()}</TableCell>
                    <TableCell>
                      <CategoryBadge category={order.category} locale={locale} />
                    </TableCell>
                    <TableCell>
                      {order.totalItems || order.items?.length || 0}
                    </TableCell>
                    <TableCell>
                      {order.user?.name || order.vendor || (locale === 'es' ? 'Sin asignar' : 'Unassigned')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(new Date(order.createdAt), locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Pagination
          currPage={pagination.page}
          nextPage={nextPage}
          previousPage={previousPage}
          perPage={pagination.perPage}
          totalItems={pagination.total}
        />
      </CardFooter>
    </Card>
  );
}
