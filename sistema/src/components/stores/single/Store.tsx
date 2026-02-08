'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import EmptyRequest from '@/components/common/EmptyData';
import ErrorRequest from '@/components/common/ErrorRequest';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';
import { IPhone } from '@/interfaces/schemas.interfaces';
import SingleStore from './SingleStore';

interface Props {
  id: string;
}

export default function Store({ id }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();

  const loadStoreData = () => {
    const token = Cookies.get('accessToken');
    setLoading(true);
    axios.get(`${API}/stores/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const store = res.data.store || res.data;
        setData({
          store: {
            id: store.id,
            name: store.name,
            icon: store.icon || 'store',
            address: store.address,
            phone: store.phone,
            mondayHours: store.mondayHours,
            tuesdayHours: store.tuesdayHours,
            wednesdayHours: store.wednesdayHours,
            thursdayHours: store.thursdayHours,
            fridayHours: store.fridayHours,
            saturdayHours: store.saturdayHours,
            sundayHours: store.sundayHours,
            appointmentDuration: store.appointmentDuration || 15,
            appointmentBuffer: store.appointmentBuffer,
            googleMapsUrl: store.googleMapsUrl,
          },
          phones: store.phonesList || [],
          accessories: store.accessoriesList || [],
        });
        setLoading(false);
        setError(false);
      })
      .catch((err) => {
        console.error('Store error:', err);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStoreData();
  }, [id]);

  if (loading) return <div>{t('common.loading')}</div>;
  if (error) return <ErrorRequest />;
  if (!data) return <EmptyRequest />;

  return <SingleStore data={data} onDataChange={loadStoreData} />;
}
