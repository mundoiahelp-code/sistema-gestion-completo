import { Suspense } from 'react';

import Single from '@/components/clients/single/Single';

const PageCliente = ({ params }: { params: { id: string } }) => {
  return (
    <Suspense fallback={<>Cargando</>}>
      <Single id={params.id} />
    </Suspense>
  );
};

export default PageCliente;
