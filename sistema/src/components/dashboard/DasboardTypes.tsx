'use client';

import { Role } from '@/enums/role.enum';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { IDashboard } from '@/interfaces/dashboard.interface';
import DashboardAdmin from './dashboards/DashboardAdmin';
import DashboardVendor from './dashboards/DashboardVendor';

interface Props {
  data: IDashboard;
}

export default function DashboardTypes({ data }: Props) {
  const { role } = useGetUserInfo();
  const roleStr = role as string;

  // Admin ve todo
  if (roleStr === Role.Admin || roleStr === 'ADMIN') return <DashboardAdmin data={data} />;
  
  // Vendedor ve dashboard limitado
  if (roleStr === Role.Seller || roleStr === 'SELLER') return <DashboardVendor data={data} />;
  
  // Por defecto mostrar admin
  return <DashboardAdmin data={data} />;
}
