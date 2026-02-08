import { Suspense } from 'react';

import OrdersLoading from '@/components/orders/OrdersLoading';
import Orders from '@/components/orders/Orders';

const PageIngresos = ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <Orders query={searchParams} />
    </Suspense>
  );
};

export default PageIngresos;
