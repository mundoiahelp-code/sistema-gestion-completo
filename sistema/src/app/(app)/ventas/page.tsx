import { Suspense } from 'react';

import Sales from '@/components/sales/Sales';
import SalesLoading from '@/components/sales/SalesLoading';

const VentasPage = ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  return (
    <Suspense fallback={<SalesLoading />}>
      <Sales query={searchParams} />
    </Suspense>
  );
};

export default VentasPage;
