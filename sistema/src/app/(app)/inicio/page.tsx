import { Suspense } from 'react';

import Dashboard from '@/components/dashboard/Dashboard';
import DashboardLoading from '@/components/dashboard/DashboardLoading';

const PageInicio = () => {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard />
    </Suspense>
  );
};

export default PageInicio;
