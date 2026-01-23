'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import ErrorRequest from '../common/ErrorRequest';
import StoresList from './StoresList';
import { useTranslation } from '@/i18n/I18nProvider';

interface Request {
  name: string;
  id: string;
  icon: string;
  phones: number;
}

export default function Stores() {
  const [data, setData] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios.get(`${API}/stores`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const stores = (res.data.stores || res.data || []).map((store: any) => ({
          id: store.id,
          name: store.name,
          icon: store.icon || 'store',
          phones: store._count?.products || 0,
        }));
        setData(stores);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Stores error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t('common.loading')}</div>;
  if (error) return <ErrorRequest />;

  return <StoresList data={data} />;
}
