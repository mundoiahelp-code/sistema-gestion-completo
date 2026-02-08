'use client';

import { useEffect, useState } from 'react';
import { LoaderIcon, User, Mail, Lock, Shield, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

import { useTranslation } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { API } from '@/config/api';
import useSonner from '@/hooks/useSonner';

interface Props {
  userId: string;
}

export default function EditUser({ userId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [originalRole, setOriginalRole] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  
  const router = useRouter();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const { t, locale } = useTranslation();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios.get(`${API}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const user = res.data.user || res.data;
        setName(user.name || '');
        setEmail(user.email || '');
        const roleMap: { [key: string]: string } = { ADMIN: 'admin', SELLER: 'vendor', MANAGER: 'vendor' };
        const mappedRole = roleMap[user.role] || 'vendor';
        setRole(mappedRole);
        setOriginalRole(mappedRole);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading user:', err);
        handleErrorSonner(locale === 'es' ? 'Error al cargar usuario' : 'Error loading user');
        setLoading(false);
      });
  }, [userId]);

  const handleSaveClick = () => {
    if (!name || !email || !role) {
      return handleErrorSonner(locale === 'es' ? 'Completá todos los campos' : 'Please fill in all fields');
    }

    // Si está cambiando de vendor a admin, pedir confirmación
    if (originalRole !== 'admin' && role === 'admin') {
      setShowAdminConfirm(true);
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    setShowAdminConfirm(false);
    const token = Cookies.get('accessToken');
    setSaving(true);

    try {
      const roleMap: { [key: string]: string } = { admin: 'ADMIN', vendor: 'SELLER' };
      const data: any = { name, email, role: roleMap[role] || role.toUpperCase() };
      if (password) {
        data.password = password;
      }

      await axios.put(`${API}/users/${userId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleSuccessSonner(locale === 'es' ? 'Usuario actualizado' : 'User updated');
      router.push('/usuarios');
    } catch (err: any) {
      console.error('Error updating user:', err);
      handleErrorSonner(err.response?.data?.error || (locale === 'es' ? 'Error al actualizar' : 'Error updating'));
    } finally {
      setSaving(false);
    }
  };

  const isPasswordValid = !password || password.length >= 6;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoaderIcon className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href='/usuarios'>
          <Button variant='ghost' size='icon'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
        </Link>
        <div>
          <h1 className='text-3xl font-bold'>{locale === 'es' ? 'Editar Usuario' : 'Edit User'}</h1>
          <p className='text-muted-foreground mt-1'>{locale === 'es' ? 'Modificá los datos del usuario' : 'Update user information'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            {locale === 'es' ? 'Información del Usuario' : 'User Information'}
          </CardTitle>
          <CardDescription>{locale === 'es' ? 'Editá los datos del usuario' : 'Edit user details'}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm font-medium flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                {locale === 'es' ? 'Nombre completo' : 'Full name'}
              </Label>
              <Input
                id='name'
                placeholder={locale === 'es' ? 'Nicolas Percio' : 'John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium flex items-center gap-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                {t('common.email')}
              </Label>
              <Input
                id='email'
                type='email'
                placeholder={locale === 'es' ? 'nicodelpercio@gmail.com' : 'john@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className='grid gap-6 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='role' className='text-sm font-medium flex items-center gap-2'>
                <Shield className='h-4 w-4 text-muted-foreground' />
                {t('users.role')}
              </Label>
              <Select onValueChange={setRole} value={role}>
                <SelectTrigger id='role'>
                  <SelectValue placeholder={locale === 'es' ? 'Seleccioná un rol' : 'Select a role'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>
                    <div className='flex items-center gap-2'>
                      <Shield className='h-4 w-4' />
                      {t('users.roles.admin')}
                    </div>
                  </SelectItem>
                  <SelectItem value='vendor'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      {t('users.roles.seller')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium flex items-center gap-2'>
                <Lock className='h-4 w-4 text-muted-foreground' />
                {locale === 'es' ? 'Nueva contraseña (opcional)' : 'New password (optional)'}
              </Label>
              <Input
                id='password'
                type='password'
                placeholder={locale === 'es' ? 'Dejar vacío para no cambiar' : 'Leave empty to keep current'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && !isPasswordValid && (
                <div className='flex items-center gap-2 text-xs'>
                  <AlertCircle className='h-3 w-3 text-amber-500' />
                  <span className='text-amber-600 dark:text-amber-400'>{locale === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className='flex items-center justify-end gap-4'>
            <Link href='/usuarios'>
              <Button variant='outline'>{t('common.cancel')}</Button>
            </Link>
            <Button
              onClick={handleSaveClick}
              disabled={saving || !isPasswordValid}
              className='min-w-[120px]'
            >
              {saving ? (
                <LoaderIcon className='h-4 w-4 animate-spin' />
              ) : (
                <>
                  <Check className='h-4 w-4 mr-2' />
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmación para cambiar a Admin */}
      <AlertDialog open={showAdminConfirm} onOpenChange={setShowAdminConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5 text-amber-500' />
              {locale === 'es' ? '¿Otorgar permisos de Administrador?' : 'Grant Admin permissions?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'es' 
                ? 'Estás a punto de darle acceso completo al sistema a este usuario. Como administrador podrá ver ganancias, capital, gestionar usuarios y acceder a todas las configuraciones.'
                : 'You are about to give this user full system access. As an admin, they will be able to view earnings, capital, manage users, and access all settings.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              {locale === 'es' ? 'Sí, otorgar acceso' : 'Yes, grant access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
