'use client';

import { LoaderIcon, User, Mail, Lock, Shield, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
import useUser from '@/hooks/useUser';
import { useTranslation } from '@/i18n/I18nProvider';

export default function AddUser() {
  const { t, locale } = useTranslation();
  const { name, email, role, password, handleAddUser, isDisabled, loading } =
    useUser();

  const isPasswordValid = password.value.length >= 6;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link href='/usuarios'>
          <Button variant='ghost' size='icon'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
        </Link>
        <div>
          <h1 className='text-3xl font-bold'>{t('users.newUser')}</h1>
          <p className='text-muted-foreground mt-1'>
            {locale === 'es' ? 'Creá un nuevo usuario para el sistema' : 'Create a new user for the system'}
          </p>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Formulario */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              {locale === 'es' ? 'Información del Usuario' : 'User Information'}
            </CardTitle>
            <CardDescription>
              {locale === 'es' ? 'Completá los datos del nuevo usuario' : 'Fill in the new user details'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              {/* Nombre */}
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-sm font-medium flex items-center gap-2'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  {locale === 'es' ? 'Nombre completo' : 'Full Name'}
                </Label>
                <Input
                  id='name'
                  placeholder={locale === 'es' ? 'Nicolas Percio' : 'John Doe'}
                  {...name}
                />
                <p className='text-xs text-muted-foreground'>
                  {locale === 'es' ? 'Nombre y apellido del usuario' : 'User first and last name'}
                </p>
              </div>

              {/* Email */}
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-sm font-medium flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  {t('common.email')}
                </Label>
                <Input
                  id='email'
                  placeholder={locale === 'es' ? 'nicodelpercio@gmail.com' : 'john@example.com'}
                  {...email}
                  type='email'
                />
                <p className='text-xs text-muted-foreground'>
                  {locale === 'es' ? 'Email para iniciar sesión' : 'Email for login'}
                </p>
              </div>
            </div>

            <Separator />

            <div className='grid gap-6 md:grid-cols-2'>
              {/* Rol */}
              <div className='space-y-2'>
                <Label htmlFor='role' className='text-sm font-medium flex items-center gap-2'>
                  <Shield className='h-4 w-4 text-muted-foreground' />
                  {t('users.role')}
                </Label>
                <Select onValueChange={role.onChange} value={role.value}>
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
                <p className='text-xs text-muted-foreground'>
                  {locale === 'es' ? 'Define los permisos del usuario' : 'Defines user permissions'}
                </p>
              </div>

              {/* Contraseña */}
              <div className='space-y-2'>
                <Label htmlFor='password' className='text-sm font-medium flex items-center gap-2'>
                  <Lock className='h-4 w-4 text-muted-foreground' />
                  {t('users.password')}
                </Label>
                <Input
                  id='password'
                  placeholder={locale === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                  {...password}
                  type='password'
                />
                {password.value && (
                  <div className='flex items-center gap-2 text-xs'>
                    {isPasswordValid ? (
                      <>
                        <Check className='h-3 w-3 text-green-500' />
                        <span className='text-green-600 dark:text-green-400'>
                          {locale === 'es' ? 'Contraseña válida' : 'Valid password'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className='h-3 w-3 text-amber-500' />
                        <span className='text-amber-600 dark:text-amber-400'>
                          {locale === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <p className='text-sm font-medium'>{locale === 'es' ? 'Crear usuario' : 'Create User'}</p>
                <p className='text-xs text-muted-foreground'>
                  {locale === 'es' ? 'El usuario podrá iniciar sesión inmediatamente' : 'User will be able to log in immediately'}
                </p>
              </div>
              <Button
                onClick={handleAddUser}
                disabled={loading || isDisabled}
                size='lg'
                className='min-w-[120px]'
              >
                {loading ? (
                  <LoaderIcon className='h-4 w-4 animate-spin' />
                ) : (
                  <>
                    <Check className='h-4 w-4 mr-2' />
                    {locale === 'es' ? 'Crear Usuario' : 'Create User'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información lateral */}
        <div className='space-y-6'>
          {/* Roles y permisos */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>{locale === 'es' ? 'Roles y Permisos' : 'Roles & Permissions'}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <Shield className='h-4 w-4 text-primary mt-0.5' />
                  <div>
                    <p className='text-sm font-medium'>{t('users.roles.admin')}</p>
                    <p className='text-xs text-muted-foreground'>
                      {locale === 'es' ? 'Acceso completo al sistema' : 'Full system access'}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <User className='h-4 w-4 text-primary mt-0.5' />
                  <div>
                    <p className='text-sm font-medium'>{t('users.roles.seller')}</p>
                    <p className='text-xs text-muted-foreground'>
                      {locale === 'es' ? 'No puede ver ganancias, capital total, usuarios ni integraciones' : 'Cannot view profits, total capital, users or integrations'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          <Card className='border-primary/20 bg-primary/5'>
            <CardContent className='pt-6'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='h-5 w-5 text-primary mt-0.5' />
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>{locale === 'es' ? 'Recomendaciones' : 'Recommendations'}</p>
                  <ul className='text-xs text-muted-foreground space-y-1 list-disc ml-4'>
                    <li>{locale === 'es' ? 'Usá emails corporativos' : 'Use corporate emails'}</li>
                    <li>{locale === 'es' ? 'Contraseñas de al menos 8 caracteres' : 'Passwords of at least 8 characters'}</li>
                    <li>{locale === 'es' ? 'Asigná el rol apropiado según las tareas' : 'Assign the appropriate role based on tasks'}</li>
                    <li>{locale === 'es' ? 'Revisá los permisos regularmente' : 'Review permissions regularly'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
