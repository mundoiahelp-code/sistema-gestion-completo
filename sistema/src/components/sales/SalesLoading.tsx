import { Skeleton } from '@/components/ui/skeleton';

export default function SalesLoading() {
  return (
    <div className='grid lg:grid-cols-4 gap-4'>
      <div className='lg:col-span-4 grid grid-cols-4 gap-3 order-last lg:order-first'>
        <div className='col-span-4 lg:col-span-1 flex flex-col gap-2'>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-80 w-full' />
        </div>
        <div className='col-span-4 lg:col-span-3'>
          <div className='rounded-md border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 grid gap-2'>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
          </div>
        </div>
      </div>{' '}
    </div>
  );
}
