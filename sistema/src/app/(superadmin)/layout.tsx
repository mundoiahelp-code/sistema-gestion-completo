'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { Building2, LogOut, Moon, Sun, Settings, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/iniciar-sesion');
      return;
    }
    
    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'SUPER_ADMIN') {
        router.push('/inicio');
        return;
      }
      setUserName(parsed.name || 'Super Admin');
      setLoading(false);
    } catch {
      router.push('/iniciar-sesion');
    }
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('locale');
    window.location.href = '/iniciar-sesion';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  const tabs = [
    { href: '/panel', label: 'Negocios', icon: Users },
    { href: '/panel/configuracion', label: 'Configuración', icon: Settings },
    { href: '/panel/cuenta', label: 'Cuenta', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image 
                src="/images/logo.png" 
                alt="Clodeb" 
                width={48} 
                height={48}
                className="object-contain"
              />
              <div>
                <h1 className="font-semibold text-zinc-900 dark:text-white">Panel de Administracion</h1>
                <p className="text-xs text-zinc-500">Clodeb Sistema</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === tab.href
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-zinc-600" />
                  )}
                </button>
              )}

              {/* User info */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-zinc-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-zinc-500">Dueño</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden border-t border-slate-200 dark:border-zinc-800">
          <div className="flex">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  pathname === tab.href
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
