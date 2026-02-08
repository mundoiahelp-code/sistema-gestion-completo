'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { getQuery } from '@/helpers/getQuery';
import { IOrder } from '@/interfaces/schemas.interfaces';
import ErrorRequest from '../common/ErrorRequest';
import AddOrderBtn from './AddOrderBtn';
import TableOrders from './TableOrders';
import OrdersLoading from './OrdersLoading';

interface Props {
  query: { [key: string]: string };
}

export default function Orders({ query }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios.get(`${API}/orders?${getQuery(query)}&limit=1000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const adaptedData = {
          results: res.data.orders || res.data || [],
          pagination: {
            page: res.data.page || 1,
            total: res.data.total || 0,
            perPage: res.data.limit || 10,
            from: ((res.data.page || 1) - 1) * (res.data.limit || 10) + 1,
            to: Math.min((res.data.page || 1) * (res.data.limit || 10), res.data.total || 0),
          },
        };
        setData(adaptedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Orders error:', err);
        setError(true);
        setLoading(false);
      });
  }, [query]);

  if (loading) return <OrdersLoading />;
  if (error) return <ErrorRequest />;

  return (
    <div className='space-y-4'>
      {/* Botón de nuevo ingreso - visible en móvil */}
      <div className='flex justify-end md:hidden'>
        <AddOrderBtn />
      </div>
      
      <div className='grid lg:grid-cols-4 gap-4'>
        <TableOrders
          data={data.results}
          pagination={data.pagination}
          query={query}
        />
        <div className='w-full hidden md:block'>
          <AddOrderBtn />
        </div>
      </div>
    </div>
  );
}
