import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';

import { UserContext } from '@/context/user/user.context';
import { UserTypes } from '@/context/user/user.types';

export default function useLogOut() {
  const { dispatch } = useContext(UserContext);
  const router = useRouter();

  const handleLogOut = () => {
    // Limpiar cookies
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('token');
    
    // Limpiar todo el localStorage relacionado con la sesión
    localStorage.removeItem('user');
    localStorage.removeItem('subscription');
    localStorage.removeItem('tenantName');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('quickSellProduct');
    
    // Limpiar rememberEmail si tiene valor inválido
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail === 'false' || (savedEmail && !savedEmail.includes('@'))) {
      localStorage.removeItem('rememberEmail');
    }
    
    // Limpiar contexto
    dispatch({ type: UserTypes.USER_DISCONNECT, payload: { user: {} } });

    // Forzar redirección al login
    window.location.href = '/iniciar-sesion';
  };

  return { handleLogOut };
}
