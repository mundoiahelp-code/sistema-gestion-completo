import { Suspense } from 'react';

import Clients from '@/components/clients/Clients';
import ClientsLoading from '@/components/clients/ClientsLoading';

const PageClientes = ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  return (
    <Suspense fallback={<ClientsLoading />}>
      <Clients query={searchParams} />
    </Suspense>
  );
};

export default PageClientes;
