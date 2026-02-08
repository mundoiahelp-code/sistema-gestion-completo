import { useContext, useEffect, useState } from 'react';

import { UserContext } from '@/context/user/user.context';
import { IUser } from '@/interfaces/schemas.interfaces';

export default function useGetUserInfo() {
  const { state } = useContext(UserContext);
  const { user } = state;
  const [localUser, setLocalUser] = useState<IUser | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Leer del localStorage como fallback
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const parsed = JSON.parse(storedUser);
        setLocalUser(parsed);
      }
    } catch (e) {
      // Error silencioso en producción
    }
  }, []);

  // Durante SSR o antes de montar, devolver un usuario por defecto
  if (!isClient) {
    return { role: 'SELLER' } as IUser; // Por defecto SELLER para no mostrar cosas de admin
  }

  // Usar el usuario del contexto, o del localStorage como fallback
  const finalUser = (user && Object.keys(user).length > 0) ? user : localUser;
  
  return (finalUser as IUser) || { role: 'SELLER' } as IUser;
}
