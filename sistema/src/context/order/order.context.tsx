'use client';

import { createContext, useReducer } from 'react';

import {
  IOrderContext,
  IOrderContextType,
} from '@/interfaces/ordercontext.interface';
import { reducer } from './order.reducer';

interface Props {
  children: React.ReactNode;
}

export const OrderContext = createContext<IOrderContextType>({
  state: { phones: [] },
  dispatch: () => {},
});

export function OrderContextProvider({ children }: Props) {
  const InitialState: IOrderContext = {
    phones: [],
  };

  const [state, dispatch] = useReducer(reducer, InitialState);

  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
}
