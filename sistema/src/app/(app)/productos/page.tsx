import { Suspense } from 'react';

import LoadingProducts from '@/components/products/LoadingProducts';
import Products from '@/components/products/Products';

const PageProductos = ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  return (
    <Suspense fallback={<LoadingProducts />}>
      <Products query={searchParams} />
    </Suspense>
  );
};

export default PageProductos;
