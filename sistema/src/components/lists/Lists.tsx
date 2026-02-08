'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/config/api';
import { IList } from '@/interfaces/schemas.interfaces';
import ErrorRequest from '../common/ErrorRequest';
import ShowEdit from './ShowEdit';
import { useTranslation } from '@/i18n/I18nProvider';

export default function Lists() {
  const { t } = useTranslation();
  const [data, setData] = useState<IList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // El backend nuevo no tiene endpoint de listas, usar datos vacíos por ahora
    setData([]);
    setLoading(false);
  }, []);

  if (loading) return <div>{t('common.loading')}</div>;
  if (error) return <ErrorRequest />;

  return <ShowEdit data={data} />;
}
