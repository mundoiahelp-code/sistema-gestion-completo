'use client';

import axios, { AxiosRequestConfig } from 'axios';
import { LoaderIcon, Lock, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

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
import useCookie from '@/hooks/useCookie';
import useField from '@/hooks/useField';
import useSonner from '@/hooks/useSonner';
import { useTranslation } from '@/i18n/I18nProvider';

export default function PasswordSettings() {
  const [accessToken] = useCookie('accessToken', false);
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';

  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  const currPassword = useField({ type: 'password' });
  const newPassword = useField({ type: 'password' });

  const handleUpdatePassword = () => {
    const config: AxiosRequestConfig = {
      url: `${API}/users/settings/password`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        currPassword: currPassword.value,
        newPassword: newPassword.value,
      },
    };

    setLoading(true);
    axios(config)
      .then((res) => {
        const response = res.data;

        if (!response.errors && !response.message) {
          handleErrorSonner(isSpanish ? 'Error en el sistema' : 'System error');
        }
        if (response.errors) {
          const msgErr = response.errors;
          if (msgErr.message === 'Invalid currPassword format')
            handleErrorSonner(isSpanish ? 'El formato de la contraseña actual es invalido' : 'Invalid current password format');
          if (msgErr.message === 'Invalid newPassword format')
            handleErrorSonner(isSpanish ? 'El formato de la contraseña nueva es invalido' : 'Invalid new password format');
          if (msgErr.message === 'Password must have more than 6 characters')
            handleErrorSonner(isSpanish ? 'La nueva contraseña debe tener un mínimo de 6 caracteres' : 'Password must have at least 6 characters');
          if (msgErr.message === 'Current Password invalid')
            handleErrorSonner(isSpanish ? 'La contraseña actual es incorrecta' : 'Current password is incorrect');
        }
        if (response.message === 'user password updated') {
          handleSuccessSonner(isSpanish ? 'Contraseña actualizada correctamente' : 'Password updated successfully');
          currPassword.onChange('');
          newPassword.onChange('');
        }
      })
      .catch((err) => {
        console.log(err);
        handleErrorSonner(isSpanish ? 'Hubo un error en el sistema' : 'System error occurred');
        currPassword.onChange('');
        newPassword.onChange('');
      })
      .finally(() => setLoading(false));
  };

  const isPasswordValid = newPassword.value.length >= 6;
  const canSubmit = currPassword.value !== '' && newPassword.value !== '' && isPasswordValid;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            {isSpanish ? 'Seguridad' : 'Security'}
          </CardTitle>
          <CardDescription>
            {isSpanish 
              ? 'Mantené tu cuenta segura actualizando tu contraseña regularmente'
              : 'Keep your account secure by updating your password regularly'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            {/* Contraseña actual */}
            <div className='space-y-2'>
              <Label htmlFor='current-password' className='text-sm font-medium flex items-center gap-2'>
                <Lock className='h-4 w-4 text-muted-foreground' />
                {isSpanish ? 'Contraseña actual' : 'Current password'}
              </Label>
              <div className='relative max-w-md'>
                <Input
                  id='current-password'
                  placeholder={isSpanish ? 'Ingresá tu contraseña actual' : 'Enter your current password'}
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currPassword.value}
                  onChange={(e) => currPassword.onChange(e.target.value)}
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showCurrentPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div className='space-y-2'>
              <Label htmlFor='new-password' className='text-sm font-medium flex items-center gap-2'>
                <Lock className='h-4 w-4 text-muted-foreground' />
                {isSpanish ? 'Nueva contraseña' : 'New password'}
              </Label>
              <div className='relative max-w-md'>
                <Input
                  id='new-password'
                  placeholder={isSpanish ? 'Ingresá tu nueva contraseña' : 'Enter your new password'}
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword.value}
                  onChange={(e) => newPassword.onChange(e.target.value)}
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showNewPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              
              {/* Indicador de fortaleza */}
              {newPassword.value && (
                <div className='space-y-2 max-w-md'>
                  <div className='flex items-center gap-2 text-xs'>
                    {isPasswordValid ? (
                      <>
                        <Check className='h-3 w-3 text-green-500' />
                        <span className='text-green-600 dark:text-green-400'>
                          {isSpanish ? 'Contraseña válida' : 'Valid password'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className='h-3 w-3 text-amber-500' />
                        <span className='text-amber-600 dark:text-amber-400'>
                          {isSpanish ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Barra de fortaleza */}
                  <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.value.length < 6
                          ? 'w-1/3 bg-red-500'
                          : newPassword.value.length < 10
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Recomendaciones de seguridad */}
          <div className='rounded-lg bg-muted/50 p-4 space-y-2'>
            <p className='text-sm font-medium flex items-center gap-2'>
              <Shield className='h-4 w-4 text-primary' />
              {isSpanish ? 'Recomendaciones de seguridad' : 'Security recommendations'}
            </p>
            <ul className='text-xs text-muted-foreground space-y-1 ml-6 list-disc'>
              <li>{isSpanish ? 'Usá al menos 8 caracteres' : 'Use at least 8 characters'}</li>
              <li>{isSpanish ? 'Combiná letras mayúsculas y minúsculas' : 'Combine uppercase and lowercase letters'}</li>
              <li>{isSpanish ? 'Incluí números y símbolos' : 'Include numbers and symbols'}</li>
              <li>{isSpanish ? 'No uses información personal obvia' : 'Avoid obvious personal information'}</li>
            </ul>
          </div>

          <Separator />

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>{isSpanish ? 'Actualizar contraseña' : 'Update password'}</p>
              <p className='text-xs text-muted-foreground'>
                {isSpanish ? 'Asegurate de recordar tu nueva contraseña' : 'Make sure to remember your new password'}
              </p>
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={loading || !canSubmit}
              className='min-w-[120px]'
            >
              {loading ? (
                <LoaderIcon className='h-4 w-4 animate-spin' />
              ) : (
                <>
                  <Check className='h-4 w-4 mr-2' />
                  {isSpanish ? 'Actualizar' : 'Update'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className='border-primary/20 bg-primary/5'>
        <CardContent className='pt-6'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='h-5 w-5 text-primary mt-0.5' />
            <div className='space-y-1'>
              <p className='text-sm font-medium'>{isSpanish ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}</p>
              <p className='text-sm text-muted-foreground'>
                {isSpanish 
                  ? 'Contactá al administrador del sistema para restablecer tu contraseña.'
                  : 'Contact the system administrator to reset your password.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
