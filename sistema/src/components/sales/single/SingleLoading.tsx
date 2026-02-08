import { Skeleton } from '@/components/ui/skeleton';

export default function SingleLoding() {
  return (
    <div className='grid gap-3 grid-cols-1 lg:grid-cols-3 '>
      <div>
        <div className='grid gap-3'>
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-48 w-full' />
        </div>
      </div>
      <div>
        <div className='grid gap-3'>
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-48 w-full' />
        </div>
      </div>
      <div>
        <div className='grid gap-3'>
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    </div>
  );
}
