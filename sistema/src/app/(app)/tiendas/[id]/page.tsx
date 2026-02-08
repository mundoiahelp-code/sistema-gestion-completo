import Store from '@/components/stores/single/Store';
import { Suspense } from 'react';

const PageTiendaInvidual = ({ params }: { params: { id: string } }) => {
  return (
    <Suspense fallback={<>Cargando...</>}>
      <Store id={params.id} />
    </Suspense>
  );
};

export default PageTiendaInvidual;
