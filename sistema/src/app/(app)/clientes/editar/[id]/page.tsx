import { Suspense } from 'react';

import Edit from '@/components/clients/edit/Edit';

const PageEditarCliente = ({ params }: { params: { id: string } }) => {
  return (
    <Suspense fallback={<>Cargando</>}>
      <Edit id={params.id} />
    </Suspense>
  );
};

export default PageEditarCliente;
