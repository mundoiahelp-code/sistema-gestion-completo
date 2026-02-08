'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { IPhone } from '@/interfaces/schemas.interfaces';
import ErrorRequest from '../common/ErrorRequest';
import TablePhones from './Table/TablePhones';
import LoadingProducts from './LoadingProducts';
import { useHiddenModels } from '@/hooks/useHiddenModels';

interface Props {
  query: { [key: string]: string };
}

export default function Products({ query }: Props) {
  const [items, setItems] = useState<IPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isModelHidden } = useHiddenModels();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios.get(`${API}/products?category=PHONE&limit=1000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const products = res.data.products || res.data || [];
        // NO filtrar por modelos ocultos en la vista de stock
        // Los modelos ocultos solo se filtran en selectores/filtros
        setItems(products);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Products error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingProducts />;
  if (error) return <ErrorRequest />;

  const filterData = (items: IPhone[]) => {
    let results = [...items];

    const filters = query;

    if (filters.model) {
      results = results.filter(
        (x) => x.model.toLowerCase() === filters.model.toLowerCase()
      );
    }
    if (filters.color) {
      results = results.filter(
        (x) => x.color.toLowerCase() === filters.color.toLowerCase()
      );
    }
    if (filters.storage) {
      results = results.filter(
        (x) => x.storage.toLowerCase() === filters.storage.toLowerCase()
      );
    }

    if (filters.minBattery) {
      results = results.filter((x) => x.battery >= +filters.minBattery);
    }

    if (filters.maxBattery) {
      results = results.filter((x) => x.battery <= +filters.maxBattery);
    }

    if (filters.store) {
      const storeId = filters.store.split('_')[0];
      results = results.filter((x: any) => x.store?.id === storeId || x.storeId === storeId);
    }

    return results;
  };

  const newData = filterData(items);

  return <TablePhones data={newData} />;
}
