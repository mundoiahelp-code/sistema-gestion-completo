import { Suspense } from 'react';

import LoadingUsers from '@/components/users/LoadingUsers';
import Users from '@/components/users/Users';

const PageUsuarios = () => {
  return (
    <Suspense fallback={<LoadingUsers />}>
      <Users />
    </Suspense>
  );
};

export default PageUsuarios;
