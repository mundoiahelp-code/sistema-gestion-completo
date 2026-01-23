import { MenuIcon, Settings, UsersIcon, Building2, Moon, Sun, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';
import { twJoin } from 'tailwind-merge';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
}: {
  item: IMenu;
  role: Role;
  pathname: string;
  t: (key: string) => string;
}) => {
  if (!item.global && !item.visible.includes(role)) return <></>;
  const displayText = item.textKey ? t(item.textKey) : item.text;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-4 px-2.5 w-max pr-16 rounded-lg text-muted-foreground hover:text-foreground ${
        pathname.includes(item.href) ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : ''
      }`}
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
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState({ name: 'Usuario', role: 'Usuario', color: 'blue' });
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
              {/* Logo negro para modo claro */}
              <Image
                src='/images/logo_apple_black.png'
                className='cursor-pointer h-auto w-auto dark:hidden'
                alt='Sistema de Gestión Apple'
                height={0}
                width={60}
                priority={true}
              />
              {/* Logo blanco para modo oscuro */}
              <Image
                src='/images/logo_apple.png'
                className='cursor-pointer h-auto w-auto hidden dark:block'
                alt='Sistema de Gestión Apple'
                height={0}
                width={60}
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
              />
            ))}
          </div>
        </nav>

        {/* Sección inferior con usuario, tema y logout */}
        <nav className='mt-auto flex flex-col gap-2 px-2 sm:py-4'>
          {/* Info del usuario */}
          <div className='flex items-center gap-3 px-2.5 py-2 mb-2 border-b border-zinc-200 dark:border-zinc-700'>
            <div
              className={twJoin(
                colorClass[userData.color] || 'bg-blue-500',
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0'
              )}
            >
              {getInitials(userData.name)}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-sm text-foreground truncate'>{userData.name}</p>
              <p className='text-xs text-muted-foreground'>{userData.role}</p>
            </div>
          </div>

          {isAdmin && (
            <Link
              href='/usuarios'
              className='flex items-center gap-4 px-2.5 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'
            >
              <UsersIcon className='h-5 w-5' />
              {t('nav.users')}
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              href='/admin'
              className='flex items-center gap-4 px-2.5 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'
            >
              <Building2 className='h-5 w-5' />
              Admin
            </Link>
          )}
          <Link
            href='/ajustes/general'
            className='flex items-center gap-4 px-2.5 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'
          >
            <Settings className='h-5 w-5' />
            {t('nav.settings')}
          </Link>

          {/* Toggle de tema */}
          <button
            onClick={toggleTheme}
            className='flex items-center gap-4 px-2.5 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full text-left'
          >
            {mounted && (
              <>
                {theme === 'dark' ? (
                  <Sun className='h-5 w-5' />
                ) : (
                  <Moon className='h-5 w-5' />
                )}
                <span>{theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}</span>
              </>
            )}
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className='flex items-center gap-4 px-2.5 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left'
          >
            <LogOut className='h-5 w-5' />
            {t('auth.logout')}
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
