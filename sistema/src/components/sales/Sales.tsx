'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { getQuery } from '@/helpers/getQuery';
import ErrorRequest from '../common/ErrorRequest';
import TableSales from './TableSales';
import SalesLoading from './SalesLoading';

interface Props {
  query: { [key: string]: string };
}

export default function Sales({ query }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios.get(`${API}/sales?${getQuery(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const adaptedData = {
          results: res.data.sales || res.data || [],
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
        console.error('Sales error:', err);
        setError(true);
        setLoading(false);
      });
  }, [query]);

  if (loading) return <SalesLoading />;
  if (error) return <ErrorRequest />;

  return (
    <TableSales
      data={data.results}
      pagination={data.pagination}
      query={query}
    />
  );
}
