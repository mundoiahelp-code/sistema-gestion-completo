import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {new Array(4).fill('').map((x, i) => (
          <Skeleton className='w-full h-28 rounded-lg' key={i} />
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {new Array(2).fill('').map((x, i) => (
          <Skeleton
            className='col-span-4 md:col-span-2 w-full h-80 rounded-lg'
            key={i}
          />
        ))}
      </div>
    </>
  );
}
