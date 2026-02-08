import { Suspense } from 'react';

import Accessories from '@/components/accessories/Accessories';
import AccessoriesLoading from '@/components/accessories/AccessoriesLoading';

const PageAccesorios = ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  return (
    <Suspense fallback={<AccessoriesLoading />}>
      <Accessories query={searchParams} />
    </Suspense>
  );
};

export default PageAccesorios;
