'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { getQuery } from '@/helpers/getQuery';
import { IClient } from '@/interfaces/schemas.interfaces';
import ErrorRequest from '../common/ErrorRequest';
import Table from './Table';
import ClientsLoading from './ClientsLoading';

interface Props {
  query: { [key: string]: string };
}

export default function Clients({ query }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios.get(`${API}/clients?${getQuery(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        // Adaptar respuesta del backend
        const adaptedData = {
          results: res.data.clients || res.data || [],
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
        console.error('Clients error:', err);
        setError(true);
        setLoading(false);
      });
  }, [query]);

  if (loading) return <ClientsLoading />;
  if (error) return <ErrorRequest />;

  return <Table data={data} query={query} />;
}
