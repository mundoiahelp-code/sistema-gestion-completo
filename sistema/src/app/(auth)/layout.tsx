'use client';

import { LanguageGate } from '@/components/i18n/LanguageGate';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageGate>
      {children}
    </LanguageGate>
  );
}
