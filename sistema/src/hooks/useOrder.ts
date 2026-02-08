import axios, { AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';

import { API } from '@/config/api';
import { OrderContext } from '@/context/order/order.context';
import { IPhone } from '@/interfaces/phone.interface';
import useCookie from './useCookie';
import useField from './useField';
import useSonner from './useSonner';

export default function useOrder() {
  const vendor = useField({ type: 'text' });
  const notes = useField({ type: 'text' });
  const store = useField({ type: 'text' });

  // Autocompletar vendedor con el nombre del usuario logueado
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const user = JSON.parse(storedUser);
        if (user?.name && !vendor.value) {
          vendor.onChange({ target: { value: user.name } } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    } catch (e) {
      // Error silencioso en producción
    }
  }, []);

  const [accessToken, setAccessToken] = useCookie('accessToken', false);

  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const { state } = useContext(OrderContext);
  const { phones } = state;

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleAddOrder = async () => {
    // validatePhones
    const phonesData: IPhone[] = [];

    let error = false;

    if (!vendor.value)
      return handleErrorSonner('Falta especificar el vendedor');
    if (!store.value)
      return handleErrorSonner('Falta especificar la ubicación del celular');

    let total = 0;
    const items: { productId: string; quantity: number; price: number }[] = [];

    phones.forEach((phone, i) => {
      if (error) return;

      if (!phone.imei) {
        error = true;
        return handleErrorSonner('Falta un IMEI');
      }
      if (!phone.model) {
        error = true;
        return handleErrorSonner('Falta un MODELO');
      }
      if (!phone.color) {
        error = true;
        return handleErrorSonner('Falta un COLOR');
      }
      if (!phone.storage) {
        error = true;
        return handleErrorSonner('Falta una CAPACIDAD');
      }
      if (!phone.battery) {
        error = true;
        return handleErrorSonner('Falta un estado de la BATERIA');
      }
      if (!phone.price) {
        error = true;
        return handleErrorSonner('Falta un PRECIO');
      }

      if (error) return;

      phonesData.push(phone);
    });

    if (error) return;

    // Obtener storeId (usar el seleccionado o el primero disponible)
    let storeId = store.value;
    if (!storeId) {
      try {
        const storesRes = await axios.get(`${API}/stores`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const stores = storesRes.data.stores || storesRes.data || [];
        if (stores.length > 0) {
          storeId = stores[0].id;
        }
      } catch (err) {
        // Error silencioso en producción
      }
    }

    if (!storeId) {
      return handleErrorSonner('No hay tiendas configuradas');
    }

    // Crear productos primero y luego crear el pedido
    for (const phone of phonesData) {
      try {
        const productData: any = {
          name: phone.model,
          model: phone.model,
          storage: phone.storage,
          color: phone.color,
          imei: phone.imei,
          price: +phone.price,
          cost: phone.cost ? +phone.cost : undefined,
          battery: +phone.battery || undefined,
          stock: 1,
          condition: 'Usado',
          category: 'PHONE',
          storeId: storeId,
          description: phone.details || undefined,
        };

        const createRes = await axios.post(`${API}/products`, productData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (createRes.data.product) {
          items.push({
            productId: createRes.data.product.id,
            quantity: 1,
            price: +phone.price,
          });
          total += +phone.price;
        }
      } catch (err: any) {
        // Error silencioso en producción
        handleErrorSonner(err.response?.data?.error || 'Error al crear producto');
        return;
      }
    }

    if (items.length === 0) {
      return handleErrorSonner('No se pudieron procesar los productos');
    }

    const config: AxiosRequestConfig = {
      url: `${API}/orders`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        items,
        total,
        notes: notes.value,
        status: 'COMPLETED',
      },
    };

    setLoading(true);
    axios(config)
      .then((res) => {
        const response = res.data;

        if (response.error) {
          handleErrorSonner(response.error);
          return;
        }

        if (response.order) {
          handleSuccessSonner('Ingreso cargado correctamente!');

          router.push('/ingresos');
          router.refresh();
        }
      })
      .catch((err) => {
        // Error silencioso en producción
        handleErrorSonner(err.response?.data?.error || 'Hubo un error en el sistema');
      })
      .finally(() => setLoading(false));
  };

  return { vendor, notes, store, handleAddOrder, loading };
}
