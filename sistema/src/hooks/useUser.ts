import axios, { AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { API } from '@/config/api';
import useCookie from './useCookie';
import useField from './useField';
import useSonner from './useSonner';

export default function useUser() {
  const [accessToken, setAccessToken] = useCookie('accessToken', false);

  const [loading, setLoading] = useState<boolean>(false);

  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const router = useRouter();

  const name = useField({
    type: 'text',
    validation: /[a-zA-Z\u00C0-\u017F\s]+$/,
  });
  const email = useField({ type: 'text' });
  const role = useField({ type: 'text' });
  const password = useField({ type: 'password' });

  const handleAddUser = () => {
    // Mapear roles del frontend al backend
    const roleMap: Record<string, string> = {
      'admin': 'ADMIN',
      'vendor': 'SELLER',
    };

    const data: AxiosRequestConfig = {
      url: `${API}/users`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        name: name.value,
        email: email.value,
        role: roleMap[role.value] || 'SELLER',
        password: password.value,
      },
    };

    setLoading(true);
    axios(data)
      .then((res) => {
        const response = res.data;

        if (response.user) {
          handleSuccessSonner('Usuario creado con exito!');
          router.push('/usuarios');
          router.refresh();
          return;
        }

        if (response.error) {
          handleErrorSonner(response.error);
          return;
        }

        if (response.errors) {
          const error = response.errors;
          if (error.message === 'Invalid name format')
            handleErrorSonner('El formato del nombre es invalido');
          if (error.message === 'Name must have more than 3 characters')
            handleErrorSonner('El nombre debe tener al menos 3 caracteres');
          if (error.message === 'Invalid name')
            handleErrorSonner('El nombre es invalido');
          if (error.message === 'Invalid email format')
            handleErrorSonner('El formato del email es invalido');
          if (error.message === 'Invalid email')
            handleErrorSonner('El email es invalido');
          if (error.message === 'Invalid password format')
            handleErrorSonner('El formato de la contraseña es invalido');
          if (error.message === 'Password must have more than 6 characters')
            handleErrorSonner('La contraseña debe tener al menos 6 caracteres');
          if (error.message === 'Invalid role format')
            handleErrorSonner('El formato del rol es invalido');
          if (error.message === 'Invalid role')
            handleErrorSonner('El rol es invalido');
          if (error.message === 'Email is already taken')
            handleErrorSonner('El email ya esta en uso');
        }
      })
      .catch((err) => {
        // Error silencioso en producción
        handleErrorSonner(err.response?.data?.error || 'Error al crear usuario');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteUser = (id: string) => {
    const data: AxiosRequestConfig = {
      url: `${API}/users/${id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    setLoading(true);
    axios(data)
      .then((res) => {
        const response = res.data;

        if (response.message) {
          handleSuccessSonner('Usuario eliminado con exito!');
          router.refresh();
          return;
        }

        if (response.error) {
          handleErrorSonner(response.error);
        }
      })
      .catch((err) => {
        // Error silencioso en producción
        handleErrorSonner(err.response?.data?.error || 'Error al eliminar usuario');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const isDisabled = Boolean(
    name.value === '' ||
      email.value === '' ||
      role.value === '' ||
      password.value === ''
  );

  return {
    name,
    email,
    role,
    password,
    handleAddUser,
    isDisabled,
    loading,
    handleDeleteUser,
  };
}
