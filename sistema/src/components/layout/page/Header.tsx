'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'es';
    setLocale(savedLocale);
  }, []);

  const homeText = locale === 'en' ? 'Home' : 'Inicio';

  return (
    <header className='xl:mr-8 justify-between sm:justify-end md:justify-between sticky top-0 z-30 flex h-16 sm:h-14 items-center gap-4 border-b bg-white dark:bg-zinc-900 dark:border-zinc-800 px-4 sm:px-6 shadow-sm sm:shadow-none sm:static sm:border-0 sm:bg-slate-100 sm:dark:bg-zinc-950'>
      <AsideMobile />
      {/* Breadcrumbs - Oculto en móvil, visible en tablet+ */}
      <Breadcrumb className='hidden md:flex'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/inicio' className="text-sm">{homeText}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((breadcrumb, i) => (
            <BreadcrumbMap breadcrumb={breadcrumb} key={i} />
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {/* Título de página en móvil */}
      <div className="md:hidden flex-1 text-center">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : homeText}
        </h1>
      </div>
    </header>
  );
}
