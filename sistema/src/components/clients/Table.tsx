'use client';

import useGetUserInfo from '@/hooks/useGetUserInfo';
import { IClient } from '@/interfaces/schemas.interfaces';
import AddClientBtn from './AddClientBtn';
import TableClients from './TableClients';

interface Props {
  data: {
    results: IClient[];
    pagination: {
      page: number;
      total: number;
      perPage: number;
      from: number;
      to: number;
    };
  };
  query: { [key: string]: string };
}

export default function Table({ data, query }: Props) {
  const { role } = useGetUserInfo();

  return (
    <div className='grid lg:grid-cols-4 gap-4'>
      <TableClients
        data={data.results}
        pagination={data.pagination}
        query={query}
      />
      <div className='w-full'>
        <AddClientBtn />
      </div>
    </div>
  );
}
