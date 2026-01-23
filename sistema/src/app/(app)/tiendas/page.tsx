import Stores from '@/components/stores/Stores';
import { Suspense } from 'react';

const PageTiendas = () => {
  return (
    <Suspense fallback={<>Cargando...</>}>
      <Stores />
    </Suspense>
  );
};

export default PageTiendas;
