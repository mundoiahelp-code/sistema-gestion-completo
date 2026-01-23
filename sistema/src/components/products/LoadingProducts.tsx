import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingProducts() {
  return (
    <div className='bg-white dark:bg-zinc-900 p-4 grid gap-2'>
      {new Array(10).fill('').map((x, i) => (
        <Skeleton className='h-4 w-full' key={i} />
      ))}
    </div>
  );
}
