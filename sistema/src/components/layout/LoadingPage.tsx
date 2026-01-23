import { Loader2Icon } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className='w-screen h-screen flex items-center justify-center absolute top-0 left-0'>
      <Loader2Icon className='h-10 w-10 animate-spin' />
    </div>
  );
}
