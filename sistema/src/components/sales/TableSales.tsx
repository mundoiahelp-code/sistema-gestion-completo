'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/helpers/formatDate';
import usePagination from '@/hooks/usePagination';
import { ISale } from '@/interfaces/schemas.interfaces';
import Pagination from '../common/Pagination';
import { twMerge } from 'tailwind-merge';
import { Plus, SearchIcon, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';
import { useTranslation } from '@/i18n/I18nProvider';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Props {
  data: ISale[];
  pagination: {
    page: number;
    total: number;
    perPage: number;
    from: number;
    to: number;
  };
  query: { [key: string]: string };
}

export default function TableSales({ data, pagination, query }: Props) {
  const { nextPage, previousPage } = usePagination('/ventas', query);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const { role } = useGetUserInfo();
  const { t, locale } = useTranslation();
  const isSeller = role === Role.Seller;

  // Filtrar por búsqueda local
  const filteredData = data.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.user?.name?.toLowerCase().includes(searchLower) ||
      item.code?.toLowerCase().includes(searchLower)
    );
  });

  // Calcular total de la página (solo para admin)
  const totalMonto = !isSeller ? filteredData
    .filter((s) => !s.cancelled)
    .reduce((sum, s) => sum + (s.total || s.totalAmount || s.amounts?.total || 0), 0) : 0;

  // Exportar ventas a Excel
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const token = Cookies.get('accessToken');
      const response = await axios.get(`${API}/sales/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { sales, summary, tenantName, lastExport } = response.data;

      if (!sales || sales.length === 0) {
        toast.info('No hay ventas nuevas para exportar');
        setExportLoading(false);
        return;
      }

      // Preparar datos para Excel
      const excelData = sales.map((sale: any) => {
        const fecha = new Date(sale.createdAt).toLocaleDateString('es-AR');
        const hora = new Date(sale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const codigo = sale.code || sale.id.slice(-6).toUpperCase();
        const vendedor = sale.user?.name || 'N/A';
        const cliente = sale.client?.name || 'Sin cliente';
        const telefono = sale.client?.phone || '';
        const sucursal = sale.store?.name || 'N/A';
        
        // Productos
        const productos = sale.items.map((item: any) => {
          const prod = item.product;
          const nombre = prod.model || prod.name || 'Producto';
          const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
          return `${nombre}${qty}`;
        }).join(', ');
        
        // IMEI si es celular
        const imeis = sale.items
          .filter((item: any) => item.product.imei)
          .map((item: any) => item.product.imei)
          .join(', ');
        
        // Calcular totales por moneda
        let totalUSD = 0;
        let totalARS = 0;
        sale.items.forEach((item: any) => {
          if (item.product.category === 'ACCESSORY') {
            totalARS += item.subtotal;
          } else {
            totalUSD += item.subtotal;
          }
        });
        
        return {
          'Fecha': fecha,
          'Hora': hora,
          'Código': codigo,
          'Vendedor': vendedor,
          'Cliente': cliente,
          'Teléfono': telefono,
          'Sucursal': sucursal,
          'Productos': productos,
          'IMEI': imeis,
          'Total USD': totalUSD > 0 ? totalUSD : '',
          'Total ARS': totalARS > 0 ? totalARS : '',
          'Método de Pago': sale.paymentMethod || '',
          'Notas': sale.notes || ''
        };
      });

      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Hoja de ventas
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 8 },  // Hora
        { wch: 10 }, // Código
        { wch: 20 }, // Vendedor
        { wch: 25 }, // Cliente
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Sucursal
        { wch: 50 }, // Productos
        { wch: 20 }, // IMEI
        { wch: 12 }, // Total USD
        { wch: 12 }, // Total ARS
        { wch: 15 }, // Método de Pago
        { wch: 30 }  // Notas
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
      
      // Hoja de resumen
      const desde = lastExport 
        ? new Date(lastExport).toLocaleDateString('es-AR')
        : new Date(sales[0].createdAt).toLocaleDateString('es-AR');
      const hasta = new Date().toLocaleDateString('es-AR');
      
      const resumenData = [
        { 'Campo': 'Negocio', 'Valor': tenantName },
        { 'Campo': 'Período desde', 'Valor': desde },
        { 'Campo': 'Período hasta', 'Valor': hasta },
        { 'Campo': 'Total de ventas', 'Valor': summary.totalVentas },
        { 'Campo': 'Total USD', 'Valor': summary.totalUSD > 0 ? `$${summary.totalUSD.toLocaleString('es-AR')}` : '-' },
        { 'Campo': 'Total ARS', 'Valor': summary.totalARS > 0 ? `$${summary.totalARS.toLocaleString('es-AR')}` : '-' },
        { 'Campo': 'Generado el', 'Valor': new Date().toLocaleString('es-AR') }
      ];
      
      const wsResumen = XLSX.utils.json_to_sheet(resumenData);
      wsResumen['!cols'] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
      
      // Descargar
      const filename = `ventas_${desde.replace(/\//g, '-')}_${hasta.replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`${sales.length} ventas exportadas correctamente`);
      
    } catch (error: any) {
      console.error('Error exporting:', error);
      if (error.response?.status === 404) {
        toast.info('No hay ventas nuevas para exportar');
      } else {
        toast.error('Error al exportar ventas');
      }
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="col-span-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
            {pagination.total} {t('sales.title').toLowerCase()}
            {!isSeller && (
              <>
                {' | '}{t('common.total')}: {' '}
                <span className="text-green-600 font-medium">${totalMonto.toLocaleString()}</span>
              </>
            )}
          </span>
          {locale === 'es' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              disabled={exportLoading}
              className="flex-shrink-0"
            >
              {exportLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  <span className="hidden sm:inline">Exportando...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </>
              )}
            </Button>
          )}
          <Button onClick={() => router.push('/ventas/crear')} size="sm" className="flex-shrink-0">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('sales.newSale')}</span>
          </Button>
        </div>
      </div>

      {/* Tabla con scroll horizontal solo en mobile */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800 md:overflow-visible overflow-x-auto">
        <Table className="w-full md:min-w-0 min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-zinc-800">
              <TableHead className="whitespace-nowrap">{t('sales.code')}</TableHead>
              <TableHead className="whitespace-nowrap">{t('sales.seller')}</TableHead>
              <TableHead className="text-center whitespace-nowrap">{t('sales.items')}</TableHead>
              {!isSeller && <TableHead className="whitespace-nowrap">{t('common.total')}</TableHead>}
              <TableHead className="whitespace-nowrap">{t('common.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSeller ? 4 : 5} className="text-center text-gray-500 py-8">
                  {t('sales.noSales')}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, i) => (
                <TableRow
                  key={i}
                  className={twMerge(
                    item.cancelled ? 'opacity-50' : '',
                    'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors'
                  )}
                  onClick={() => router.push(`/ventas/${item.id}`)}
                >
                  <TableCell className="font-mono text-sm text-gray-500">
                    #{item.code || item.id?.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.user?.name || (locale === 'es' ? 'Sin usuario' : 'No user')}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-sm">
                      {item.items?.length || 0}
                    </span>
                  </TableCell>
                  {!isSeller && (
                    <TableCell>
                      <span className={twMerge(
                        item.cancelled ? 'text-gray-400 line-through' : 'text-green-600 font-semibold'
                      )}>
                        ${(item.total || item.totalAmount || item.amounts?.total || 0).toLocaleString()}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                    {formatDate(item.createdAt, locale, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginación */}
      {pagination.total > pagination.perPage && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800 mt-2 md:mt-0 md:border-t md:rounded-t-none">
          <Pagination
            currPage={pagination.page}
            nextPage={nextPage}
            perPage={pagination.perPage}
            previousPage={previousPage}
            totalItems={pagination.total}
          />
        </div>
      )}
    </div>
  );
}
