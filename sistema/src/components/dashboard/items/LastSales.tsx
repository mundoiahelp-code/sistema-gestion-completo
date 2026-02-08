'use client';

import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/helpers/formatDate';
import { useTranslation } from '@/i18n/I18nProvider';

interface SaleData {
  id: string;
  code?: string;
  total: number;
  client?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  itemsCount?: number;
  createdAt: Date | string;
}

interface Props {
  data: SaleData[];
}

export default function LastSales({ data }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>{t('dashboard.recentSales')}</CardTitle>
        </CardHeader>
        <CardContent className='text-gray-400 dark:text-gray-500 text-sm'>
          {t('sales.noSales')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>{t('dashboard.recentSales')}</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead className='md:table-cell hidden'>{t('sales.seller')}</TableHead>
              <TableHead>{t('common.total')}</TableHead>
              <TableHead>{t('common.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow
                key={i}
                className='cursor-pointer'
                onClick={() => router.push(`/ventas/${item.id}`)}
              >
                <TableCell>#{item.code || item.id.slice(-6).toUpperCase()}</TableCell>
                <TableCell className='md:table-cell hidden'>
                  {item.user?.name || (locale === 'es' ? 'Sin usuario' : 'No user')}
                </TableCell>
                <TableCell>${item.total?.toLocaleString() || 0}</TableCell>
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
