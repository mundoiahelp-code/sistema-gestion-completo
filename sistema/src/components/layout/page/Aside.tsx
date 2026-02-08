'use client';

import { Settings, UsersIcon, Moon, Sun, LogOut, ChevronUp, Building2, Crown, Sparkles, MessageCircle, Calendar, Users, Store, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';
import { twJoin } from 'tailwind-merge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<'basic' | 'pro'>('pro');
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
    const requiredPlan = isLockedByPro ? 'Pro' : isLockedByBasic ? 'Básico' : null;
    
    const handleClick = (e: React.MouseEvent) => {
      if (isLocked) {
        e.preventDefault();
        // Solo mostrar modal a administradores
        if (isAdmin) {
          setUpgradeModalPlan(isLockedByPro ? 'pro' : 'basic');
          setUpgradeModalOpen(true);
        }
        // Para no-admins, simplemente no hacer nada (no navegar)
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
          ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
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
    // Limpiar flags de banners de plan
    localStorage.removeItem('plan-limit-banner-users-dismissed');
    localStorage.removeItem('plan-limit-banner-stores-dismissed');
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
              {/* Logo Clodeb - cambia según tema */}
              <Image
                src="/images/logo-dark.svg"
                alt="Clodeb"
                height={28}
                width={28}
                priority
                className="dark:hidden"
              />
              <Image
                src="/images/logo-white.svg"
                alt="Clodeb"
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
        
        {/* Usuarios solo para admin (no super admin) */}
        {isAdmin && !isSuperAdmin && (
          <NavItem href="/usuarios" icon={UsersIcon} label="Usuarios" labelKey="nav.users" />
        )}
      </nav>

      {/* Perfil del usuario con dropdown */}
      <div className="relative px-3 pb-3" ref={menuRef}>
        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 py-1 z-50">
            <button
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors"
            >
              {mounted && (
                <>
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  )}
                  <span className="text-sm text-slate-700 dark:text-zinc-300">
                    {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                  </span>
                </>
              )}
            </button>
            
            <Link
              href="/ajustes/general"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
              <span className="text-sm text-slate-700 dark:text-zinc-300">{t('nav.settings')}</span>
            </Link>
            
            <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{t('auth.logout')}</span>
            </button>
          </div>
        )}
        
        {/* Botón del perfil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all"
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
          <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Modal de Upgrade */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Plan {upgradeModalPlan === 'pro' ? 'Profesional' : 'Básico'}
                </DialogTitle>
                <p className="text-sm text-zinc-500">Potenciá tu negocio</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-6">
            {upgradeModalPlan === 'pro' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-green-900 dark:text-green-100">Asistente IA por WhatsApp</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">Bot inteligente que atiende a tus clientes 24/7 automáticamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-blue-900 dark:text-blue-100">Agenda turnos automáticamente</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Los registra en el sistema en tiempo real</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-purple-900 dark:text-purple-100">Hasta 18 usuarios</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Agregá todos los vendedores que necesites</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800">
                  <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-orange-900 dark:text-orange-100">Hasta 10 sucursales</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Gestioná múltiples locales desde un solo lugar</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-700 shadow-lg">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-green-900 dark:text-green-100">CRM completo</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1.5 leading-relaxed">
                      Gestioná clientes, seguimientos y conversaciones desde un solo lugar. 
                      <span className="font-semibold"> Enviá mensajes masivos a grupos de WhatsApp.</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-blue-900 dark:text-blue-100">Más equipo y sucursales</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Hasta 8 usuarios y 5 sucursales para crecer sin límites</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)} className="flex-1">
              Cerrar
            </Button>
            <Button 
              onClick={() => {
                const message = `Hola, quiero actualizar el sistema al Plan ${upgradeModalPlan === 'pro' ? 'Profesional' : 'Básico'}`;
                const whatsappUrl = `https://wa.me/5491138514845?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                setUpgradeModalOpen(false);
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Consultar Plan {upgradeModalPlan === 'pro' ? 'Pro' : 'Básico'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

export default Aside;
