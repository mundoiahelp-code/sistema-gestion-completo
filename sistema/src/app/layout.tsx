import './globals.css';
import Favicons from '@/components/layout/Favicons';
import { ConstructionIcon } from 'lucide-react';
import { Providers } from './providers';

export const metadata = {
  title: 'Clodeb - Sistema de Gestión',
  description: 'Sistema de Gestión con IA para tu negocio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintance = false;

  if (maintance) {
    return (
      <html lang="es" className="font-brand">
        <head>
          <Favicons />
        </head>
        <body>
          <main className="w-screen h-screen bg-gray-100 flex justify-center">
            <div className="mt-20 text-center">
              <ConstructionIcon className="w-96 h-96 stroke-1 text-red-500" />
              <p className="text-xl font-medium text-red-500">
                Sitio en mantenimiento
              </p>
            </div>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Favicons />
      </head>
      <body className="bg-slate-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
