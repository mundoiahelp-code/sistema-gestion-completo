import ErrorRequest from '@/components/common/ErrorRequest';
import useGetRequest from '@/hooks/useGetRequest';
import { IClient } from '@/interfaces/schemas.interfaces';
import EditClient from './EditClient';

export default async function Edit({ id }: { id: string }) {
  const { data, err } = await useGetRequest<IClient>(`client/${id}`);

  if (err) return <ErrorRequest />;

  return <EditClient data={data} />;
}
