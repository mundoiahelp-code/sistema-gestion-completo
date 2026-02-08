'use client';

import axios, { AxiosRequestConfig } from 'axios';
import { LoaderIcon, User, Mail, Palette, Check } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { twJoin } from 'tailwind-merge';

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
import { Separator } from '@/components/ui/separator';
import { API } from '@/config/api';
import { UserContext } from '@/context/user/user.context';
import { UserTypes } from '@/context/user/user.types';
import useCookie from '@/hooks/useCookie';
import useField from '@/hooks/useField';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import useSonner from '@/hooks/useSonner';
import { colorClass } from '@/lib/preferences';
import { useTranslation } from '@/i18n/I18nProvider';
import LogoSettings from './LogoSettings';

export default function GeneralSettings() {
  const user = useGetUserInfo();
  const { dispatch } = useContext(UserContext);
  const { t, locale } = useTranslation();

  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const [accessToken] = useCookie('accessToken', false);

  const [loading, setLoading] = useState<boolean>(false);
  const [colorLoading, setColorLoading] = useState<boolean>(false);
  const [colorActive, setColorActive] = useState(user.avatarColor || user.preferences?.colorIcon || 'black');

  // Sincronizar colorActive cuando cambia el usuario
  useEffect(() => {
    setColorActive(user.avatarColor || user.preferences?.colorIcon || 'black');
  }, [user.avatarColor, user.preferences?.colorIcon]);

  const name = useField({
    type: 'text',
    initialValue: '',
    validation: /[a-zA-Z\u00C0-\u017F\s]+$/,
  });

  // Cargar el nombre cuando el usuario esté disponible
  useEffect(() => {
    if (user?.name && !name.value) {
      name.onChange({ target: { value: user.name } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [user?.name]);

  const handleUpdateAccount = () => {
    const config: AxiosRequestConfig = {
      url: `${API}/users/settings/account`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        name: name.value,
      },
    };

    setLoading(true);
    axios(config)
      .then((res) => {
        const response = res.data;

        if (!response.errors && !response.message) {
          handleErrorSonner('Error en el sistema');
        }
        if (response.errors) {
          const msgErr = response.errors;
          if (msgErr.message === 'Invalid name format')
            handleErrorSonner('El formato del nombre es invalido');
          if (msgErr.message === 'Name must have more than 3 characters')
            handleErrorSonner('El nombre debe tener mas de 3 caracteres');
          if (msgErr.message === 'Invalid name')
            handleErrorSonner('El nombre debe tener mas de 3 caracteres');
        }
        if (response.message === 'user account updated') {
          dispatch({
            payload: { user: { ...user, name: name.value } },
            type: UserTypes.UPDATE_USER,
          });
          localStorage.setItem(
            'user',
            JSON.stringify({ ...user, name: name.value })
          );
          // Disparar evento para actualizar el sidebar
          window.dispatchEvent(new Event('userUpdated'));
          handleSuccessSonner('Cuenta actualizada correctamente');
        }
      })
      .catch((err) => {
        console.log(err);
        handleErrorSonner('Hubo un error en el sistema');
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateColor = () => {
    setColorLoading(true);
    
    const config: AxiosRequestConfig = {
      url: `${API}/users/settings/avatar-color`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        color: colorActive,
      },
    };

    axios(config)
      .then((res) => {
        if (res.data.message === 'avatar color updated') {
          const newUserData = {
            ...user,
            avatarColor: colorActive,
            preferences: { ...user.preferences, colorIcon: colorActive },
          };
          dispatch({
            type: UserTypes.UPDATE_USER,
            payload: {
              user: newUserData,
            },
          });
          localStorage.setItem('user', JSON.stringify(newUserData));
          // Disparar evento para actualizar el sidebar
          window.dispatchEvent(new Event('userUpdated'));
          handleSuccessSonner('Color de perfil actualizado');
        }
      })
      .catch((err) => {
        console.error('Error updating color:', err);
        handleErrorSonner(locale === 'es' ? 'Error al actualizar el color' : 'Error updating color');
      })
      .finally(() => setColorLoading(false));
  };

  const colors: string[] = Object.keys(colorClass);
  const userName = user?.name || 'Usuario';
  const userInitials = userName && userName.length > 0
    ? userName.length === 1
      ? userName[0][0] + (userName[0][1] || '')
      : userName[0][0] + (userName[1]?.[0] || '')
    : 'U';

  return (
    <div className='space-y-6'>
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            {locale === 'es' ? 'Información Personal' : 'Personal Information'}
          </CardTitle>
          <CardDescription>
            {locale === 'es' ? 'Actualizá tu nombre y datos de perfil' : 'Update your name and profile details'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm font-medium flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                {locale === 'es' ? 'Nombre completo' : 'Full Name'}
              </Label>
              <Input 
                id='name'
                placeholder={locale === 'es' ? 'Tu nombre' : 'Your name'}
                {...name} 
                className='max-w-md'
              />
              <p className='text-xs text-muted-foreground'>
                {locale === 'es' ? 'Este nombre se mostrará en tu perfil y en el sistema' : 'This name will be displayed on your profile and throughout the system'}
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium flex items-center gap-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                {t('common.email')}
              </Label>
              <Input
                id='email'
                placeholder='Email'
                disabled
                defaultValue={user.email}
                className='max-w-md bg-muted'
              />
              <p className='text-xs text-muted-foreground'>
                {locale === 'es' ? 'El email no se puede modificar' : 'Email cannot be changed'}
              </p>
            </div>
          </div>

          <Separator />

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>{locale === 'es' ? 'Guardar cambios' : 'Save Changes'}</p>
              <p className='text-xs text-muted-foreground'>
                {locale === 'es' ? 'Actualizá tu información personal' : 'Update your personal information'}
              </p>
            </div>
            <Button
              onClick={handleUpdateAccount}
              disabled={loading || user.name === name.value || name.value === ''}
              className='min-w-[100px]'
            >
              {loading ? (
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

      {/* Personalización */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Palette className='h-5 w-5' />
            {locale === 'es' ? 'Personalización' : 'Customization'}
          </CardTitle>
          <CardDescription>
            {locale === 'es' ? 'Personalizá la apariencia de tu perfil' : 'Customize your profile appearance'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <Label className='text-sm font-medium'>{t('users.avatarColor')}</Label>
            <div className='flex flex-col md:flex-row gap-8 items-start md:items-center'>
              {/* Selector de colores */}
              <div className='flex flex-wrap gap-3'>
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setColorActive(color)}
                    className={twJoin(
                      colorClass[color],
                      'h-10 w-10 rounded-full cursor-pointer transition-all hover:scale-110',
                      color === colorActive 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-muted-foreground/50'
                    )}
                    title={color}
                  />
                ))}
              </div>

              {/* Preview del avatar */}
              <div className='flex flex-col items-center gap-3'>
                <div
                  className={twJoin(
                    colorClass[colorActive],
                    'overflow-hidden rounded-full uppercase font-semibold h-20 w-20 text-3xl flex justify-center items-center text-white shadow-lg'
                  )}
                >
                  {userInitials}
                </div>
                <p className='text-xs text-muted-foreground'>{locale === 'es' ? 'Vista previa' : 'Preview'}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>{locale === 'es' ? 'Aplicar color' : 'Apply Color'}</p>
              <p className='text-xs text-muted-foreground'>
                {locale === 'es' ? 'El color se aplicará a tu avatar en todo el sistema' : 'The color will be applied to your avatar throughout the system'}
              </p>
            </div>
            <Button
              onClick={handleUpdateColor}
              disabled={colorLoading || (user.avatarColor || user.preferences?.colorIcon || 'black') === colorActive}
              className='min-w-[100px]'
            >
              {colorLoading ? (
                <LoaderIcon className='h-4 w-4 animate-spin' />
              ) : (
                <>
                  <Check className='h-4 w-4 mr-2' />
                  {locale === 'es' ? 'Aplicar' : 'Apply'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo del Negocio - Solo para ADMIN */}
      {user.role === 'ADMIN' && <LogoSettings />}
    </div>
  );
}
