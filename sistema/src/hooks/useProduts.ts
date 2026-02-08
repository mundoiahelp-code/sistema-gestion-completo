import axios, { AxiosRequestConfig } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { API } from '@/config/api';
import useCookie from '@/hooks/useCookie';
import useSonner from '@/hooks/useSonner';
import { IPhone } from '@/interfaces/schemas.interfaces';
import { useRouter } from 'next/navigation';
import { getNotificationMessages } from '@/helpers/notificationMessages';

export default function UseProducts(data: IPhone[], locale: string = 'es') {
  const [accessToken, setAccessToken] = useCookie('accessToken', false);
  const { handleErrorSonner, handleSuccessSonner } = useSonner();
  const messages = getNotificationMessages(locale);

  const [imeiUsed, setImeiUsed] = useState<string>('');

  const [items, setItems] = useState<IPhone[]>(data);

  const handleSearchImei = (imei: string) => {
    const phoneFinded = data.find((x) => String(x.imei) === imei);

    setItems(phoneFinded ? [phoneFinded] : []);
    setImeiUsed(imei);
  };

  const handleRemoveImei = () => {
    setImeiUsed('');
    setItems(data);
  };

  const handleUpdate = async (
    id: string,
    index: number,
    updateData: { [key: string]: string }
  ) => {
    // Convertir campos numéricos de string a number
    const processedData: any = { ...updateData };
    
    // Campos que deben ser números
    const numericFields = ['price', 'cost', 'battery', 'stock', 'reserved', 'warrantyDays'];
    
    numericFields.forEach(field => {
      if (processedData[field] !== undefined && processedData[field] !== '') {
        if (field === 'price' || field === 'cost') {
          processedData[field] = parseFloat(processedData[field]);
        } else {
          processedData[field] = parseInt(processedData[field]);
        }
      }
    });

    const config: AxiosRequestConfig = {
      url: `${API}/products/${id}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: processedData,
    };
    await axios(config)
      .then((res) => {
        handleSuccessSonner(messages.productUpdated);
        setItems((prev) => {
          const items = [...prev];
          items[index] = { ...items[index], ...updateData };
          return [...items];
        });
      })
      .catch((err) => {
        // Error silencioso en producción
        return handleErrorSonner(messages.errorUpdating);
      });
  };

  const handleDeletePhone = (id: string, index: number) => {
    if (!confirm(messages.confirmDelete)) return;

    const config: AxiosRequestConfig = {
      url: `${API}/products/${id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    axios(config)
      .then((res) => {
        data.splice(index, 1);
        setItems(() => [...data]);
        return handleSuccessSonner(messages.productDeleted);
      })
      .catch((err) => {
        // Error silencioso en producción
        return handleErrorSonner(messages.errorDeleting);
      });
  };

  const router = useRouter();

  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshEveryTime = () => {
    router.refresh();
  };

  useEffect(() => {
    ref.current = setInterval(refreshEveryTime, 1000 * 60 * 1.5);

    return () => {
      if (ref.current) {
        clearInterval(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (imeiUsed) {
      const phoneFinded = data.find((x) => String(x.imei) === imeiUsed);

      setItems(phoneFinded ? [phoneFinded] : []);
    }
    if (imeiUsed === '') {
      setItems(data);
    }
  }, [data]);

  const handleReserveChange = (id: string, reserved: boolean) => {
    // Actualizar el estado local inmediatamente
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reserved } : item
      )
    );
    // También actualizar el array original para que no se pierda en el useEffect
    const index = data.findIndex((item) => item.id === id);
    if (index !== -1) {
      data[index].reserved = reserved;
    }
  };

  return {
    items,
    handleSearchImei,
    handleDeletePhone,
    handleUpdate,
    imeiUsed,
    handleRemoveImei,
    handleReserveChange,
  };
}
