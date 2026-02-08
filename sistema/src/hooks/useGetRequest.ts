import { cookies } from 'next/headers';

import useAxios from './useAxios';

export default async function useGetRequest<T>(url: string) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken');

  return await useAxios<T>(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken?.value || ''}`,
    },
  });
}
