import { usePathname } from 'next/navigation';

import { breadcrumbs } from '@/lib/breadcrumbs';
import Aside from './Aside';
import Header from './Header';

export default function Page({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='flex min-h-screen w-full flex-col bg-slate-100 dark:bg-zinc-950'>
      <Aside />
      <div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-48'>
        <Header breadcrumbs={breadcrumbs[pathname] ?? []} />
        <main className='flex min-h-[calc(100vh_-_theme(spacing.24))] flex-1 flex-col gap-4 p-4 md:gap-4 md:p-4 lg:p-8 max-w-7xl'>
          {children}
        </main>
      </div>
    </div>
  );
}
