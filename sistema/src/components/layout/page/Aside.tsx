'use client';

import { Settings, UsersIcon, Moon, Sun, LogOut, ChevronUp, Building2, Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';
import { twJoin } from 'tailwind-merge';
import { toast } from 'sonner';

import { Menu, getMenuForLocale } from '@/lib/menuContent';
import { colorClass } from '@/lib/preferences';
import { useTranslation, useI18n } from '@/i18n/I18nProvider';

type PlanType = 'trial' | 'basic' | 'pro';

function Aside() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Usuario');
  const [userColor, setUserColor] = useState('blue');
  const [tenantName, setTenantName] = useState('');
  const [tenantLogo, setTenantLogo] = useState('');
  const [plan, setPlan] = useState<PlanType>('trial');
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  // Helpers para verificar plan
  const isPro = plan === 'pro';
  const isBasicOrHigher = plan === 'basic' || plan === 'pro';
  const isTrial = plan === 'trial';

  const loadUserData = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setIsAdmin(parsed.role === 'ADMIN' || parsed.role === 'SUPER_ADMIN');
        setIsSuperAdmin(parsed.role === 'SUPER_ADMIN');
        setUserName(parsed.name || 'Usuario');
        // Priorizar avatarColor sobre preferences.colorIcon
        setUserColor(parsed.avatarColor || parsed.preferences?.colorIcon || 'blue');
        setUserRole(parsed.role === 'SUPER_ADMIN' ? 'Dueño' : parsed.role === 'ADMIN' ? 'Admin' : 'Usuario');
      } catch {}
    }
    // Cargar plan desde subscription
    const subscription = localStorage.getItem('subscription');
    if (subscription) {
      try {
        const subData = JSON.parse(subscription);
        setPlan(subData.plan || 'trial');
      } catch {}
    }
    // Siempre leer el nombre del tenant desde localStorage (se actualiza en el wizard)
    const savedTenantName = localStorage.getItem('tenantName');
    if (savedTenantName) {
      setTenantName(savedTenantName);
    }
    // Cargar logo del tenant
    const savedTenantLogo = localStorage.getItem('tenantLogo');
    if (savedTenantLogo) {
      setTenantLogo(savedTenantLogo);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadUserData();

    // Escuchar cambios en localStorage (cuando se actualiza el color o el tenant)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'tenantName') {
        loadUserData();
      }
    };

    // Escuchar evento custom para cambios en la misma pestaña
    const handleUserUpdate = () => {
      loadUserData();
    };

    // Escuchar evento storage genérico (para la misma pestaña)
    const handleGenericStorage = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('storage', handleGenericStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('storage', handleGenericStorage);
    };
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setShowThemeConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href: string) => pathname.includes(href);

  const NavItem = ({ href, icon: Icon, label, labelKey, requiresBasic, requiresPro }: { href: string; icon: any; label: string; labelKey?: string; requiresBasic?: boolean; requiresPro?: boolean }) => {
    const active = isActive(href);
    const displayLabel = labelKey ? t(labelKey) : label;
    
    // Determinar si está bloqueado
    const isLockedByBasic = requiresBasic && !isBasicOrHigher && !isSuperAdmin;
    const isLockedByPro = requiresPro && !isPro && !isSuperAdmin;
    const isLocked = isLockedByBasic || isLockedByPro;
    
    // Determinar qué plan necesita
    const requiredPlan = isLockedByPro ? 'Profesional' : isLockedByBasic ? 'Básico' : null;
    
    const handleClick = (e: React.MouseEvent) => {
      if (isLocked) {
        e.preventDefault();
        toast.error(`Esta función requiere el plan ${requiredPlan}`, {
          action: {
            label: 'Ver planes',
            onClick: () => window.open('https://mundoaple.store#planes', '_blank'),
          },
        });
      }
    };
    
    return (
      <Link
        href={isLocked ? '#' : href}
        onClick={handleClick}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
          ${active 
            ? 'bg-white dark:bg-zinc-800 shadow-sm font-medium' 
            : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'
          }
          ${isLocked ? 'opacity-60' : ''}
          text-[#0d0d0d] dark:text-zinc-100
        `}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm flex-1">{displayLabel}</span>
        {isLockedByPro && (
          <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded">
            PRO
          </span>
        )}
        {isLockedByBasic && !isLockedByPro && (
          <span className="text-[10px] font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-1.5 py-0.5 rounded">
            BÁSICO
          </span>
        )}
      </Link>
    );
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/iniciar-sesion';
  };

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-48 flex-col sm:flex bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-zinc-800/50">
      {/* Logo */}
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          {tenantLogo ? (
            /* Logo personalizado del tenant */
            <img
              src={tenantLogo}
              alt={tenantName || 'Logo'}
              className="h-7 w-7 object-contain"
            />
          ) : (
            <>
              {/* Logo negro para modo claro */}
              <Image
                src="/images/logo_apple_black.png"
                alt="iPhone Zone Sur"
                height={28}
                width={28}
                priority
                className="block dark:hidden"
              />
              {/* Logo blanco para modo oscuro */}
              <Image
                src="/images/logo_apple.png"
                alt="iPhone Zone Sur"
                height={28}
                width={28}
                priority
                className="hidden dark:block"
              />
            </>
          )}
          <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">{tenantName || 'Mi Negocio'}</span>
        </Link>
      </div>

      {/* Menu principal */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {getMenuForLocale(locale).map((item, i) => {
          // Filtrar por rol si tiene restricción de visible
          if (item.visible && item.visible.length > 0) {
            const user = localStorage.getItem('user');
            if (user) {
              try {
                const parsed = JSON.parse(user);
                const userRole = parsed.role;
                // Si el item tiene restricción de visible y el usuario no está en la lista, no mostrar
                if (!item.visible.includes(userRole)) {
                  return null;
                }
              } catch {}
            }
          }
          
          return (
            <NavItem 
              key={i} 
              href={item.href} 
              icon={item.icon} 
              label={item.text} 
              labelKey={item.textKey} 
              requiresBasic={item.requiresBasic} 
              requiresPro={item.requiresPro} 
            />
          );
        })}
        {isAdmin && !isSuperAdmin && (
          <NavItem href="/usuarios" icon={UsersIcon} label="Usuarios" labelKey="nav.users" />
        )}
        {/* SuperAdmin ya no ve nada aquí - tiene su propio panel en /panel */}
      </nav>

      {/* Perfil del usuario estilo ChatGPT */}
      <div className="px-3 pb-3 relative" ref={menuRef}>
        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700 overflow-hidden z-50">
            {/* Header con pelotita, nombre y email */}
            <div className="px-3 py-3 border-b border-slate-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div
                  className={twJoin(
                    colorClass[userColor] || 'bg-blue-500',
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0'
                  )}
                >
                  {getInitials(userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#0d0d0d] dark:text-zinc-100 truncate">{userName}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{userRole}</p>
                </div>
              </div>
            </div>

            {/* Opciones del menú */}
            <div className="py-1">
              {/* Toggle tema - cambia directamente */}
              <button
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                {mounted && (
                  <>
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <span className="text-sm text-[#0d0d0d] dark:text-zinc-100">
                      {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                    </span>
                  </>
                )}
              </button>

              {/* Ajustes */}
              <Link
                href="/ajustes/general"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm text-[#0d0d0d] dark:text-zinc-100">{t('nav.settings')}</span>
              </Link>

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Botón del perfil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
        >
          <div
            className={twJoin(
              colorClass[userColor] || 'bg-blue-500',
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs'
            )}
          >
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sm text-[#0d0d0d] dark:text-zinc-100 truncate">{userName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{userRole}</p>
          </div>
          <ChevronUp className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${menuOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
}

export default Aside;
