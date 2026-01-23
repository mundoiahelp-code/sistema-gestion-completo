import { API } from '@/config/api';
import axios, { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function useStores() {
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const getStores = () => {
    // Obtener token directamente de la cookie
    const token = Cookies.get('accessToken') || Cookies.get('token');
    
    if (!token) {
      console.error('❌ No token found for stores request');
      setLoadingStores(false);
      return;
    }

    console.log('🔍 Fetching stores from:', `${API}/stores`);

    const config: AxiosRequestConfig = {
      url: `${API}/stores`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios(config)
      .then((res) => {
        console.log('✅ Stores response:', res.data);
        const storesList = (res.data.stores || res.data || []).map((store: any) => ({
          id: store.id,
          name: store.name,
        }));
        console.log('📦 Stores list:', storesList);
        setStores(storesList);
      })
      .catch((err) => {
        console.error('❌ Error loading stores:', err.response?.data || err.message);
      })
      .finally(() => setLoadingStores(false));
  };

  useEffect(() => {
    getStores();
  }, []);

  return { stores, loadingStores, refetch: getStores };
}
