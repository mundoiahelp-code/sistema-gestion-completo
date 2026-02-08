'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import OnboardingWizard from './OnboardingWizard';
import { Loader2 } from 'lucide-react';

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Obtener rol del usuario desde localStorage
      let userRole = '';
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const parsed = JSON.parse(user);
          userRole = parsed.role || '';
        }
      } catch {}

      // Solo el ADMIN del negocio ve el wizard (no SUPER_ADMIN ni otros roles)
      const isAdmin = userRole === 'ADMIN';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Solo mostrar onboarding si es ADMIN y el tenant no completó el wizard
        setNeedsOnboarding(!data.tenant?.onboardingCompleted && isAdmin);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setNeedsOnboarding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Si necesita onboarding, solo mostrar el wizard
  if (needsOnboarding) {
    return <OnboardingWizard onComplete={handleComplete} />;
  }

  // Si no necesita onboarding, mostrar el contenido normal
  return <>{children}</>;
}
