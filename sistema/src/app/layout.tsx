import './globals.css';
import Favicons from '@/components/layout/Favicons';
import { Toaster } from '@/components/ui/sonner';
import { UserContextProvider } from '@/context/user/user.context';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ConstructionIcon } from 'lucide-react';

export const metadata = {
  title: 'Sistema de Gestión Apple',
  description: 'Sistema de Gestión Apple',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintance = false;

  if (maintance)
    return (
      <html lang='es' className='font-brand'>
        <head>
          <Favicons />
        </head>
        <body>
          <main className='w-screen h-screen bg-gray-100 flex justify-center'>
            <div className='mt-20 text-center'>
              <ConstructionIcon className='w-96 h-96 stroke-1 text-red-500' />
              <p className='text-xl font-medium text-red-500'>
                Sitio en mantenimiento
              </p>
            </div>
          </main>
        </body>
      </html>
    );

  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        <Favicons />
      </head>
      <body className="bg-slate-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <UserContextProvider>{children}</UserContextProvider>
          </I18nProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
