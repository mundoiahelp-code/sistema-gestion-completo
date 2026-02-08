import { MenuIcon, Settings, UsersIcon, Building2, Moon, Sun, LogOut, Sparkles, MessageCircle, Calendar, Users, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';
import { twJoin } from 'tailwind-merge';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Role } from '@/enums/role.enum';
import { IMenu } from '@/interfaces/layout.interface';
import { getMenuForLocale } from '../../../lib/menuContent';
import { useTranslation } from '@/i18n/I18nProvider';
import { colorClass } from '@/lib/preferences';

// Función helper para verificar si es admin
const checkIsAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      const user = JSON.parse(storedUser);
      const role = user?.role || '';
      return role === 'ADMIN' || role === 'SUPER_ADMIN' || String(role).toUpperCase() === 'ADMIN';
    }
  } catch (e) {
    console.error('Error reading user:', e);
  }
  return false;
};

// Función helper para verificar si es super admin
const checkIsSuperAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      const user = JSON.parse(storedUser);
      return user?.role === 'SUPER_ADMIN';
    }
  } catch (e) {
    console.error('Error reading user:', e);
  }
  return false;
};

// Función helper para obtener el rol
const getUserRole = (): Role => {
  if (typeof window === 'undefined') return Role.Seller;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      const user = JSON.parse(storedUser);
      return user?.role || Role.Seller;
    }
  } catch (e) {
    console.error('Error reading user:', e);
  }
  return Role.Seller;
};

// Función helper para obtener datos del usuario
const getUserData = () => {
  if (typeof window === 'undefined') return { name: 'Usuario', role: 'Usuario', color: 'blue' };
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      const user = JSON.parse(storedUser);
      return {
        name: user?.name || 'Usuario',
        role: user?.role === 'SUPER_ADMIN' ? 'Dueño' : user?.role === 'ADMIN' ? 'Admin' : 'Usuario',
        color: user?.preferences?.colorIcon || 'blue'
      };
    }
  } catch (e) {
    console.error('Error reading user:', e);
  }
  return { name: 'Usuario', role: 'Usuario', color: 'blue' };
};

const AsideMobileItem = ({
  item,
  role,
  pathname,
  t,
  onLockedClick,
}: {
  item: IMenu;
  role: Role;
  pathname: string;
  t: (key: string) => string;
  onLockedClick: (plan: 'Pro' | 'Básico') => void;
}) => {
  if (!item.global && !item.visible.includes(role)) return <></>;
  const displayText = item.textKey ? t(item.textKey) : item.text;

  // Verificar si está bloqueado
  const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const subscription = typeof window !== 'undefined' ? localStorage.getItem('subscription') : null;
  let plan = 'trial';
  let isSuperAdmin = false;
  
  if (subscription) {
    try {
      const subData = JSON.parse(subscription);
      plan = subData.plan || 'trial';
    } catch {}
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      isSuperAdmin = userData.role === 'SUPER_ADMIN';
    } catch {}
  }
  
  const isPro = plan === 'pro';
  const isBasicOrHigher = plan === 'basic' || plan === 'pro';
  const isLockedByBasic = item.requiresBasic && !isBasicOrHigher && !isSuperAdmin;
  const isLockedByPro = item.requiresPro && !isPro && !isSuperAdmin;
  const isLocked = isLockedByBasic || isLockedByPro;
  const requiredPlan = isLockedByPro ? 'Pro' : isLockedByBasic ? 'Básico' : null;

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked && requiredPlan) {
      e.preventDefault();
      // Verificar si es admin
      const userData = user ? JSON.parse(user) : null;
      const isAdmin = userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN';
      // Solo mostrar modal a administradores
      if (isAdmin) {
        onLockedClick(requiredPlan);
      }
      // Para no-admins, simplemente no hacer nada (no navegar)
    }
  };

  return (
    <Link
      href={isLocked ? '#' : item.href}
      onClick={handleClick}
      className={`flex items-center gap-4 px-2.5 w-max pr-16 rounded-lg text-muted-foreground hover:text-foreground ${
        pathname.includes(item.href) ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : ''
      } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <item.icon className='h-5 w-5' />
      {displayText}
    </Link>
  );
};

export default function AsideMobile() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [role, setRole] = useState<Role>(Role.Seller);
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [openProfileMenu, setOpenProfileMenu] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState({ name: 'Usuario', role: 'Usuario', color: 'blue' });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Básico'>('Pro');
  const { t, locale } = useTranslation();
  const { theme, setTheme } = useTheme();

  const pathname = usePathname();

  useEffect(() => {
    setOpenMenu(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    setIsAdmin(checkIsAdmin());
    setIsSuperAdmin(checkIsSuperAdmin());
    setRole(getUserRole());
    setUserData(getUserData());
  }, []);

  const menuItems = getMenuForLocale(locale);

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

  // Manejar clic en función bloqueada
  const handleLockedClick = (plan: 'Pro' | 'Básico') => {
    setSelectedPlan(plan);
    setUpgradeModalOpen(true);
  };

  // Abrir WhatsApp con mensaje
  const handleUpgradeClick = () => {
    const message = `Hola, quiero actualizar el sistema al Plan ${selectedPlan}`;
    const whatsappUrl = `https://wa.me/5491138514845?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setUpgradeModalOpen(false);
  };

  return (
    <>
      {/* Modal de upgrade */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Plan {selectedPlan}
                </DialogTitle>
                <p className="text-sm text-zinc-500">Potenciá tu negocio</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            {selectedPlan === 'Pro' ? (
              <>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-green-900 dark:text-green-100">Asistente IA por WhatsApp</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">Bot inteligente 24/7</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-blue-900 dark:text-blue-100">Agenda automática</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Turnos en tiempo real</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-purple-900 dark:text-purple-100">Hasta 18 usuarios</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Todo tu equipo</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-700 shadow-lg">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-green-900 dark:text-green-100">CRM completo</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1.5 leading-relaxed">
                      Clientes, seguimientos y conversaciones. 
                      <span className="font-semibold"> Mensajes masivos a grupos.</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-blue-900 dark:text-blue-100">Más equipo y sucursales</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">8 usuarios y 5 sucursales</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleUpgradeClick} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Consultar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={openMenu} onOpenChange={setOpenMenu}>
      <SheetTrigger asChild>
        <Button size='icon' variant='outline' className='sm:hidden'>
          <MenuIcon className='h-5 w-5' />
          <span className='sr-only'>Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='sm:max-w-xs flex flex-col'>
        <nav className='flex flex-col gap-8 text-lg font-medium'>
          <div>
            <Link
              href='/inicio'
              className='group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold md:text-base'
            >
              {/* Logo Clodeb */}
              <Image
                src='/images/logo-icon.png'
                className='cursor-pointer h-auto w-auto'
                alt='Clodeb'
                height={0}
                width={60}
                priority={true}
              />
                priority={true}
              />
            </Link>
          </div>
          <div className='flex flex-col gap-4'>
            {menuItems.map((item, i) => (
              <AsideMobileItem
                item={item}
                key={i}
                role={role}
                pathname={pathname}
                t={t}
                onLockedClick={handleLockedClick}
              />
            ))}
            
            {/* Usuarios visible en el menú (solo para admin, no super admin) */}
            {isAdmin && !isSuperAdmin && (
              <Link
                href='/usuarios'
                onClick={() => setOpenMenu(false)}
                className='flex items-center gap-4 px-2.5 w-max pr-16 rounded-lg text-muted-foreground hover:text-foreground'
              >
                <UsersIcon className='h-5 w-5' />
                {t('nav.users')}
              </Link>
            )}
          </div>
        </nav>

        {/* Sección inferior con perfil y dropdown */}
        <div className='mt-auto px-2 sm:py-4 border-t border-zinc-200 dark:border-zinc-700 pt-4'>
          {/* Dropdown de opciones de perfil */}
          {openProfileMenu && (
            <div className='mb-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 py-1'>
              <button
                onClick={() => {
                  toggleTheme();
                  setOpenProfileMenu(false);
                }}
                className='w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors'
              >
                {mounted && (
                  <>
                    {theme === 'dark' ? (
                      <Sun className='h-4 w-4 text-zinc-600 dark:text-zinc-400' />
                    ) : (
                      <Moon className='h-4 w-4 text-zinc-600 dark:text-zinc-400' />
                    )}
                    <span className='text-sm text-zinc-700 dark:text-zinc-300'>
                      {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                    </span>
                  </>
                )}
              </button>
              
              <Link
                href='/ajustes/general'
                onClick={() => {
                  setOpenProfileMenu(false);
                  setOpenMenu(false);
                }}
                className='flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors'
              >
                <Settings className='h-4 w-4 text-zinc-600 dark:text-zinc-400' />
                <span className='text-sm text-zinc-700 dark:text-zinc-300'>{t('nav.settings')}</span>
              </Link>
              
              <div className='h-px bg-zinc-200 dark:bg-zinc-700 my-1' />
              
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400'
              >
                <LogOut className='h-4 w-4' />
                <span className='text-sm font-medium'>{t('auth.logout')}</span>
              </button>
            </div>
          )}
          
          {/* Botón del perfil */}
          <button
            onClick={() => setOpenProfileMenu(!openProfileMenu)}
            className='w-full flex items-center gap-3 px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors'
          >
            <div
              className={twJoin(
                colorClass[userData.color] || 'bg-blue-500',
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0'
              )}
            >
              {getInitials(userData.name)}
            </div>
            <div className='flex-1 min-w-0 text-left'>
              <p className='font-medium text-sm text-foreground truncate'>{userData.name}</p>
              <p className='text-xs text-muted-foreground'>{userData.role}</p>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
