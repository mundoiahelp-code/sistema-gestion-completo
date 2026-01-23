import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import AsideMobile from './AsideMobile';

interface Props {
  breadcrumbs?: { name: string; href: string }[];
}

const BreadcrumbMap = ({
  breadcrumb,
}: {
  breadcrumb: { name: string; href: string };
}) => {
  return (
    <>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href={breadcrumb.href}>{breadcrumb.name}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </>
  );
};

export default function Header({ breadcrumbs = [] }: Props) {
  return (
    <header className='xl:mr-8 justify-between sm:justify-end md:justify-between sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-slate-100 dark:bg-zinc-950 dark:border-zinc-800 px-4 sm:static sm:h-auto sm:border-0 sm:px-6'>
      <AsideMobile />
      <Breadcrumb className='hidden md:flex'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/inicio'>Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((breadcrumb, i) => (
            <BreadcrumbMap breadcrumb={breadcrumb} key={i} />
          ))}
        </BreadcrumbList>
      </Breadcrumb>
{/* Pelotita removida - ahora está en el sidebar */}
    </header>
  );
}
