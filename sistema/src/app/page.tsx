'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('accessToken') || Cookies.get('token');
    if (token) {
      // Verificar si es SUPER_ADMIN
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed.role === 'SUPER_ADMIN') {
            router.push('/panel');
            return;
          }
        } catch (e) {
          // Si hay error parseando, continuar normal
        }
      }
      router.push('/inicio');
    } else {
      router.push('/iniciar-sesion');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}
