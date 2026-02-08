import { useRouter } from 'next/navigation';

import { getQuery } from '@/helpers/getQuery';

export default function usePagination(
  crrPage: string,
  query: { [key: string]: string }
) {
  const router = useRouter();

  const nextPage = () => {
    const { page, ...rest } = query;
    const newQuery = getQuery(rest);

    if (!page) return router.push(`${crrPage}?page=2&${newQuery}`);

    router.push(`${crrPage}?page=${parseInt(page) + 1}&${newQuery}`);
  };

  const previousPage = () => {
    const { page, ...rest } = query;
    const newQuery = getQuery(rest);

    if (!page) return router.push(`${crrPage}?page=1&${newQuery}`);
    router.push(`${crrPage}?page=${parseInt(page) - 1}&${newQuery}`);
  };

  return { nextPage, previousPage };
}
