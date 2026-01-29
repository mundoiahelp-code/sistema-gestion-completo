'use client';

import dynamic from 'next/dynamic';

const IntegracionesContent = dynamic(
  () => import('@/components/settings/IntegracionesContent'),
  { 
    ssr: false,
    loading: () => <div className="p-6">Cargando...</div>
  }
);

export default function IntegracionesPage() {
  return <IntegracionesContent />;
}
