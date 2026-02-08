import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

type privacy = 'public' | 'private';

const parseJwt = (token: string) => {
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (e) {
    return null;
  }
};

// Función para limpiar todos los datos de sesión
const clearAllSessionData = () => {
  // Limpiar cookies
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('token');
  
  // Limpiar localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('subscription');
  localStorage.removeItem('tenantName');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
};

export default function useProtectRoute(privacy: privacy) {
  const [authenticating, setAuthenticating] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    const userLS = localStorage.getItem('user');
    
    const tokenDecoded = parseJwt(accessToken || '');
    const isValidToken = tokenDecoded && tokenDecoded.exp * 1000 > Date.now();
    
    // Validar que el userId del token coincida con el usuario en localStorage
    let userDataValid = false;
    if (userLS && tokenDecoded) {
      try {
        const userData = JSON.parse(userLS);
        // El token debe corresponder al mismo usuario
        userDataValid = userData.id === tokenDecoded.userId;
        
        if (!userDataValid) {
          // Token y localStorage no coinciden - limpiando sesión
          clearAllSessionData();
        }
      } catch (e) {
        // Error silencioso en producción
        clearAllSessionData();
      }
    }
    
    const isLoggedIn = Boolean(accessToken && userLS && isValidToken && userDataValid);

    if (privacy === 'private' && !isLoggedIn) {
      // No está logueado o datos inconsistentes, limpiar y redirigir al login
      if (accessToken || userLS) {
        // Hay datos parciales, limpiar todo
        clearAllSessionData();
      }
      const redirectUrl = `/iniciar-sesion${pathname === '/' ? '' : `?redirect=${pathname}`}`;
      router.replace(redirectUrl);
      return;
    }

    if (privacy === 'public' && isLoggedIn) {
      // Ya está logueado correctamente, redirigir al inicio
      router.replace('/inicio');
      return;
    }

    setAuthenticating(false);
  }, []);

  return { authenticating };
}
