'use client';

import AddOrder from '@/components/orders/add/AddOrder';
import { OrderContextProvider } from '@/context/order/order.context';

const PageIngresosCargar = () => {
  return (
    <OrderContextProvider>
      <AddOrder />
    </OrderContextProvider>
  );
};

export default PageIngresosCargar;
