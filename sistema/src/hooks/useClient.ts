import axios, { AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { API } from '@/config/api';
import useCookie from './useCookie';
import useField from './useField';
import useSonner from './useSonner';

interface df {
  id?: string;
  name?: string;
  dni?: string;
  phone?: string;
  email?: string;
  zone?: string;
  page?: string;
  discount?: number;
}

export default function useClient(df: df) {
  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const [accessToken, setAccessToken] = useCookie('accessToken', false);

  const router = useRouter();

  const name = useField({
    type: 'text',
    validation: /[a-zA-Z\u00C0-\u017F\s]+$/,
    initialValue: df.name ? df.name : '',
  });
  const dni = useField({
    type: 'text',
    validation: /^[0-9]*$/,
    initialValue: df.dni ? df.dni : '',
  });
  const phone = useField({
    type: 'text',
    validation: /^[0-9]*$/,
    initialValue: df.phone ? df.phone : '',
  });
  const email = useField({
    type: 'text',
    initialValue: df.email ? df.email : '',
  });
  const zone = useField({
    type: 'text',
    validation: /[a-zA-Z\u00C0-\u017F\s]+$/,
    initialValue: df.zone ? df.zone : '',
  });
  const page = useField({ type: 'text', initialValue: df.page ? df.page : '' });
  // const discount = useField({
  //   type: 'text',
  //   validation: /^[0-9]*$/,
  //   initialValue: typeof df.discount === 'number' ? String(df.discount) : '0',
  // });

  const [loading, setLoading] = useState<boolean>(false);

  const isDisabled = Boolean(
    name.value === '' ||
      dni.value === '' ||
      // discount.value === '' ||
      zone.value === '' ||
      dni.value.length !== 8
  );

  const handleAddClient = () => {
    const config: AxiosRequestConfig = {
      url: `${API}/clients`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        name: name.value,
        dni: dni.value,
        phone: phone.value,
        email: email.value,
        address: zone.value, // El backend nuevo usa 'address' en lugar de 'zone'
      },
    };

    setLoading(true);

    axios(config)
      .then((res) => {
        handleSuccessSonner('Cliente creado con éxito!');
        router.push('/clientes');
        router.refresh();
      })
      .catch((err) => {
        console.error('Error creating client:', err);
        if (err.response?.data?.error) {
          handleErrorSonner(err.response.data.error);
        } else {
          handleErrorSonner('Error al crear el cliente');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateClient = () => {
    const updateData: { [key: string]: string } = {};

    if (name.value) updateData.name = name.value;
    if (dni.value) updateData.dni = dni.value;
    if (phone.value) updateData.phone = phone.value;
    if (email.value) updateData.email = email.value;
    if (zone.value) updateData.address = zone.value;

    const config: AxiosRequestConfig = {
      url: `${API}/clients/${df.id}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: updateData,
    };

    setLoading(true);

    axios(config)
      .then((res) => {
        handleSuccessSonner('Cliente actualizado con éxito!');
        router.push('/clientes');
        router.refresh();
      })
      .catch((err) => {
        console.error('Error updating client:', err);
        if (err.response?.data?.error) {
          handleErrorSonner(err.response.data.error);
        } else {
          handleErrorSonner('Error al actualizar el cliente');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleRemoveClient = () => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    const config: AxiosRequestConfig = {
      url: `${API}/clients/${df.id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    setLoading(true);

    axios(config)
      .then((res) => {
        handleSuccessSonner('Cliente eliminado con éxito!');
        router.push('/clientes');
        router.refresh();
      })
      .catch((err) => {
        // Error silencioso en producción
        handleErrorSonner('Error al eliminar el cliente');
      })
      .finally(() => setLoading(false));
  };

  return {
    name,
    dni,
    phone,
    email,
    zone,
    page,
    // discount,
    loading,
    isDisabled,
    handleAddClient,
    handleUpdateClient,
    handleRemoveClient,
  };
}
