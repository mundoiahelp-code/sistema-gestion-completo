'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';

import { formatDate } from '@/helpers/formatDate';
import { useTranslation } from '@/i18n/I18nProvider';

interface OrderData {
  id: string;
  code?: string;
  totalItems: number;
  vendor?: string;
  createdAt: Date | string;
}

interface Props {
  data: OrderData[];
}

export default function LastOrders({ data }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
        </CardHeader>
        <CardContent className='text-gray-400 dark:text-gray-500 text-sm'>
          {t('common.noResults')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t('products.units')}</TableHead>
              <TableHead className='md:table-cell hidden'>{locale === 'es' ? 'Vendedor' : 'Seller'}</TableHead>
              <TableHead>{t('common.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow
                key={i}
                className='cursor-pointer'
                onClick={() => router.push(`/ingresos/${item.id}`)}
              >
                <TableCell>#{item.code || item.id.slice(-6).toUpperCase()}</TableCell>
                <TableCell>{item.totalItems}</TableCell>
                <TableCell className='md:table-cell hidden'>
                  {item.vendor || (locale === 'es' ? 'Sin vendedor' : 'No seller')}
                </TableCell>
                <TableCell>
                  {formatDate(item.createdAt, locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
