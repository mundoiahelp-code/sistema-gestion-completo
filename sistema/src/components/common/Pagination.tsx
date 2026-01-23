import { MouseEventHandler } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  nextPage: MouseEventHandler<HTMLButtonElement>;
  previousPage: MouseEventHandler<HTMLButtonElement>;
  currPage: number;
  totalItems: number;
  perPage: number;
}

export default function Pagination({
  nextPage,
  previousPage,
  currPage,
  perPage,
  totalItems,
}: Props) {
  if (totalItems <= 20) return <></>;

  return (
    <div className='flex justify-end w-full items-center gap-3 mt-4 p-1'>
      <div className='flex gap-3 items-center'>
        {currPage > 1 && (
          <Button
            className='bg-gray-400 h-7 hover:bg-gray-500'
            onClick={previousPage}
          >
            <ArrowLeft className='h-4 w-5' />
          </Button>
        )}
        <div className='flex items-center gap-2'>
          <span className='md:block hidden'>Pagina</span>
          <span>
            {currPage} de {Math.ceil(totalItems / perPage)}
          </span>
        </div>
        {totalItems / currPage > 20 && (
          <Button
            className='bg-gray-400 h-7 hover:bg-gray-500'
            onClick={nextPage}
          >
            <ArrowRight className='h-4 w-5' />
          </Button>
        )}
      </div>
    </div>
  );
}
