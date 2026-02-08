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
      // No hay token disponible
      setLoadingStores(false);
      return;
    }

    const config: AxiosRequestConfig = {
      url: `${API}/stores`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios(config)
      .then((res) => {
        const storesList = (res.data.stores || res.data || []).map((store: any) => ({
          id: store.id,
          name: store.name,
        }));
        setStores(storesList);
      })
      .catch((err) => {
        // Error silencioso en producción
      })
      .finally(() => setLoadingStores(false));
  };

  useEffect(() => {
    getStores();
  }, []);

  return { stores, loadingStores, refetch: getStores };
}
