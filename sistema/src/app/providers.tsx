'use client';

import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <I18nProvider>
        {children}
        <Toaster position="top-right" richColors />
      </I18nProvider>
    </ThemeProvider>
  );
}
