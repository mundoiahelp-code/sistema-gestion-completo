import Link from 'next/link';

export default function ErrorRequest() {
  return (
    <div className='flex items-center justify-center'>
      <div className='flex flex-col gap-2'>
        <p className='text-2xl font-light text-slate-700'>
          Hubo un error interno
        </p>
        <div className='text-center'>
          <Link href={'/'} className='text-black hover:underline'>
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
