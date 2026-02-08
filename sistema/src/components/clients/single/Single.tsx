import EmptyRequest from '@/components/common/EmptyData';
import ErrorRequest from '@/components/common/ErrorRequest';
import useGetRequest from '@/hooks/useGetRequest';
import { IClient, ISale } from '@/interfaces/schemas.interfaces';
import Client from './Client';

interface Request {
  client: IClient;
  sales: ISale[];
}

export default async function Single({ id }: { id: string }) {
  const { data, err } = await useGetRequest<Request | null>(
    `client/single/${id}`
  );

  if (err) return <ErrorRequest />;

  if (data === null) return <EmptyRequest />;

  return <Client data={data} />;
}
