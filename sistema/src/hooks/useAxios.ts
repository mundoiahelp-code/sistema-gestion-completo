import axios, { AxiosRequestConfig } from 'axios';

import { API } from '@/config/api';

export default async function useAxios<T = unknown>(
  url: string,
  options: AxiosRequestConfig
): Promise<{ data: T; err: boolean }> {
  return await axios(`${API}/${url}`, options)
    .then((res) => {
      return { data: res.data, err: false };
    })
    .catch((err) => {
      // Error silencioso en producción
      return { data: {} as any, err: true };
    });
}
