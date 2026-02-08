'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import ErrorRequest from '@/components/common/ErrorRequest';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/helpers/formatDate';
import { translateColor } from '@/helpers/translateColor';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';

import { Loader2 } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    model: string;
    color?: string;
    storage?: string;
    imei?: string;
  };
}

interface OrderData {
  id: string;
  total: number;
  status: string;
  notes?: string;
  createdAt: string;
  user?: { id: string; name: string };
  items: OrderItem[];
}

interface Props {
  id: string;
}

export default function SingleOrder({ id }: Props) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = Cookies.get('accessToken');
        
        const res = await axios.get(`${API}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data.order);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !order) return <ErrorRequest />;

  const code = order.id.slice(-6).toUpperCase();

  return (
    <div className='grid grid-cols-4'>
      <Card className='col-span-4 md:col-span-2'>
        <CardHeader>
          <CardTitle className='flex justify-between'>
            <span>{isSpanish ? 'Ingreso' : 'Entry'} #{code}</span>
            <span className='text-gray-600'>
              {formatDate(order.createdAt, locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </CardTitle>
          <CardDescription>{order.user?.name || (isSpanish ? 'Sin vendedor' : 'No seller')}</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className='font-medium mb-2'>{isSpanish ? 'Productos' : 'Products'} ({order.items.length}):</h2>
          <ul className='space-y-2'>
            {order.items.map((item, i) => (
              <li key={i} className='text-sm p-2 bg-gray-50 dark:bg-zinc-800 rounded'>
                <p className='font-medium dark:text-zinc-100'>
                  {item.product.name || item.product.model}
                  {item.product.color && ` - ${translateColor(item.product.color, locale)}`}
                  {item.product.storage && ` ${item.product.storage}`}
                </p>
                {item.product.imei && (
                  <p className='text-xs text-gray-500 dark:text-zinc-400'>IMEI: {item.product.imei}</p>
                )}
                <p className='text-green-600'>${item.price.toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </CardContent>
        {order.notes && (
          <CardFooter className='flex flex-col items-start border-t pt-4'>
            <h2 className='font-medium'>{isSpanish ? 'Notas' : 'Notes'}:</h2>
            <p className='text-sm text-gray-600'>{order.notes}</p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
