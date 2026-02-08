'use client';

import { createContext, useEffect, useReducer } from 'react';

import useCookie from '@/hooks/useCookie';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
  IUserContext,
  IUserContextType,
} from '@/interfaces/usercontext.interface';
import { reducer } from './user.reducer';

interface Props {
  children: React.ReactNode;
}

export const UserContext = createContext<IUserContextType>({
  state: { user: {}, loggedIn: false },
  dispatch: () => {},
});

const InitialState: IUserContext = {
  user: {},
  loggedIn: false,
};

export function UserContextProvider({ children }: Props) {
  const [userLS] = useLocalStorage('user', {});
  const [accessToken] = useCookie('accessToken', false);

  const [state, dispatch] = useReducer(reducer, InitialState);

  // Actualizar el estado cuando se carguen los datos del cliente
  useEffect(() => {
    const isUser = Boolean(Object.keys(userLS ?? {}).length > 0 && accessToken);
    if (isUser && userLS) {
      dispatch({ type: 'USER_SUCCESS' as any, payload: { user: userLS } });
    }
  }, [userLS, accessToken]);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}
