import Lists from '@/components/lists/Lists';
import { Suspense } from 'react';

const PageListados = () => {
  return (
    <Suspense fallback={<>Cargando...</>}>
      <Lists />
    </Suspense>
  );
};

export default PageListados;
