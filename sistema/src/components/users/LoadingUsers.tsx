import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingUsers() {
  return (
    <div className='grid grid-cols-3'>
      <Card className='col-span-3 md:col-span-2'>
        <CardHeader>
          <div>
            <Skeleton className='h-4 w-[80px]' />
          </div>
          <div className='text-sm text-zinc-500'>
            <Skeleton className='h-3 w-[250px]' />
          </div>
        </CardHeader>
        <CardContent className='grid gap-2'>
          {new Array(10).fill('').map((x, i) => (
            <Skeleton className='h-4 w-full' key={i} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
