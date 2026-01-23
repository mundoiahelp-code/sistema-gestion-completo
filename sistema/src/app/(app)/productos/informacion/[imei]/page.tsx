import { Suspense } from 'react';

import Single from '@/components/products/Single/Single';

const PageProductos = ({ params }: { params: { imei: string } }) => {
  return (
    <Suspense fallback={<>Cargando...</>}>
      <Single imei={params.imei} />
    </Suspense>
  );
};

export default PageProductos;
