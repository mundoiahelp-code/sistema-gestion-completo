'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { twJoin } from 'tailwind-merge';
import { Users as UsersIcon, Search, UserPlus, Mail, MoreVertical } from 'lucide-react';
import { API } from '@/config/api';
import ErrorRequest from '@/components/common/ErrorRequest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Role } from '@/enums/role.enum';
import { getRole } from '@/helpers/getRole';
import { toTitleCase } from '@/helpers/toTitleCase';
import { IUser } from '@/interfaces/schemas.interfaces';
import { colorClass } from '@/lib/preferences';
import DeleteUser from './DeleteUser';
import LoadingUsers from './LoadingUsers';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import PlanLimitBanner from '@/components/common/PlanLimitBanner';

export default function Users() {
  const [data, setData] = useState<IUser[]>([]);
  const [filteredData, setFilteredData] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, locale } = useTranslation();
  
  const userInfo = useGetUserInfo();
  const userRole = userInfo?.role as string;
  const isAdmin = userRole === Role.Admin || userRole === 'ADMIN';

  useEffect(() => {
    const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
    axios.get(`${API}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const users = (res.data.users || res.data || []).map((user: any) => ({
          ...user,
          preferences: { 
            colorIcon: user.avatarColor || user.preferences?.colorIcon || 'blue' 
          },
        }));
        setData(users);
        setFilteredData(users);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Users error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Filtrar usuarios por búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const getRoleBadgeClass = (role: string) => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'admin') {
      return 'bg-zinc-900 dark:bg-zinc-700 text-white dark:text-zinc-100';
    }
    return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300';
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  if (loading) return <LoadingUsers />;
  if (error) return <ErrorRequest />;

  return (
    <div className='space-y-4'>
      {/* Banner de límite de plan Trial */}
      <PlanLimitBanner type="users" currentCount={data.length} />
      
      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle>{t('users.title')}</CardTitle>
              <CardDescription>
                {filteredData.length} {filteredData.length === 1 ? (locale === 'es' ? 'usuario' : 'user') : (locale === 'es' ? 'usuarios' : 'users')}
              </CardDescription>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              {/* Búsqueda */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder={t('common.search') + '...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-9 w-full sm:w-[250px]'
                />
              </div>
              {/* Botón Agregar Usuario */}
              <Link href='/usuarios/agregar'>
                <Button className='w-full sm:w-auto'>
                  <UserPlus className='h-4 w-4 mr-2' />
                  {t('users.newUser')}
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <UsersIcon className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>{t('users.noUsers')}</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {searchTerm
                  ? t('common.noResults')
                  : (locale === 'es' ? 'Agregá tu primer usuario para comenzar' : 'Add your first user to get started')}
              </p>
              {!searchTerm && (
                <Link href='/usuarios/agregar'>
                  <Button>
                    <UserPlus className='h-4 w-4 mr-2' />
                    {t('users.newUser')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[60px]'>Avatar</TableHead>
                    <TableHead>{locale === 'es' ? 'Usuario' : 'User'}</TableHead>
                    <TableHead>{t('users.role')}</TableHead>
                    <TableHead className='hidden lg:table-cell'>{t('common.email')}</TableHead>
                    <TableHead className='w-[80px]'>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div
                          className={twJoin(
                            colorClass[user.preferences.colorIcon],
                            'overflow-hidden rounded-full uppercase font-semibold h-10 w-10 text-sm flex justify-center items-center text-white shadow-sm'
                          )}
                        >
                          {getUserInitials(user.name)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{toTitleCase(user.name)}</span>
                          <span className='text-sm text-muted-foreground lg:hidden'>
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                          {locale === 'es' ? getRole(user.role) : (user.role === 'ADMIN' ? 'Admin' : 'Seller')}
                        </span>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Mail className='h-4 w-4' />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex justify-center'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <Link href={`/usuarios/editar/${user.id}`}>
                                <DropdownMenuItem className='cursor-pointer'>
                                  <Pencil className='h-4 w-4 mr-2' />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                              </Link>
                              {user.role !== Role.Admin && (user.role as string) !== 'ADMIN' && (
                                <DeleteUser 
                                  id={user.id} 
                                  onDeleted={() => setData(prev => prev.filter(u => u.id !== user.id))}
                                />
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
