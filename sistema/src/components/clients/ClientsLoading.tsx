import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsLoading() {
  return (
    <div className='grid grid-cols-4'>
      <div className='bg-white dark:bg-zinc-900 rounded-lg p-4 lg:col-span-3 col-span-4'>
        <Skeleton className='h-4 w-[8rem]' />

        <Skeleton className='mt-2 h-3 w-[12rem]' />

        <div className='grid gap-2 mt-4'>
          {new Array(10).fill('').map((x, i) => (
            <Skeleton className='h-4 w-full' key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
