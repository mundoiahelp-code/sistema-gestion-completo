'use client';

import { useEffect, useState } from 'react';
import ProgressBar from '@/components/layout/ProgressBar';
import Page from '@/components/layout/page/Page';
import { LanguageGate } from '@/components/i18n/LanguageGate';
import OnboardingGate from '@/components/onboarding/OnboardingGate';
import SubscriptionBlock from '@/components/subscription/SubscriptionBlock';
import PlanExpirationBanner from '@/components/PlanExpirationBanner';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const userData = localStorage.getItem('user');
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          if (parsedUser.role === 'ADMIN' || parsedUser.role === 'SELLER' || parsedUser.role === 'MANAGER') {
            try {
              const token = Cookies.get('token');
              const res = await fetch(`${API}/tenants/current`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.tenant) {
                setTenant(data.tenant);
                
                if (data.tenant.planExpires) {
                  const expires = new Date(data.tenant.planExpires);
                  const now = new Date();
                  const isExpired = expires < now;
                  
                  setSubscription({
                    isExpired,
                    plan: data.tenant.plan,
                    nextPaymentDate: data.tenant.planExpires,
                    status: data.tenant.paymentStatus
                  });
                }
              }
            } catch (error) {
              // Error silencioso en producción
            }
          }
        } catch (e) {
          // Error silencioso en producción
        }
      }
      
      setChecked(true);
    };

    loadData();
  }, []);

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('token');
    localStorage.clear();
    window.location.href = '/iniciar-sesion';
  };

  if (checked && subscription?.isExpired && user?.role !== 'SUPER_ADMIN') {
    return (
      <SubscriptionBlock
        isAdmin={user?.role === 'ADMIN'}
        plan={subscription?.plan || 'basic'}
        expiredAt={subscription?.nextPaymentDate}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <LanguageGate>
      <Page>
        <ProgressBar />
        {checked && user?.role === 'ADMIN' && tenant?.planExpires && (
          <PlanExpirationBanner 
            planExpires={tenant.planExpires} 
            planStatus={tenant.paymentStatus}
          />
        )}
        <OnboardingGate>
          {children}
        </OnboardingGate>
      </Page>
    </LanguageGate>
  );
}
