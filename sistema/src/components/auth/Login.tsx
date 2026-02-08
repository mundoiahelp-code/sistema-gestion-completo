import axios, { AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { EyeIcon, EyeOffIcon, LoaderCircleIcon } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API } from '@/config/api';
import { UserContext } from '@/context/user/user.context';
import { UserTypes } from '@/context/user/user.types';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/i18n/I18nProvider';

const Login = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberEmailRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorRequest, setErrorRequest] = useState<string>('');
  const [rememberEmail, setRememberEmail] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantLogo, setTenantLogo] = useState<string>('');

  const params = useSearchParams();

  const { dispatch } = useContext(UserContext);

  const handleLogIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !emailRef.current?.value ||
      !passwordRef.current?.value ||
      !rememberEmailRef.current
    )
      return;

    const emailTyped = emailRef.current.value;
    const passwordTyped = passwordRef.current.value;
    const rememberEmailValue = rememberEmailRef.current.ariaChecked;

    const data: AxiosRequestConfig = {
      url: `${API}/auth/login`,
      method: 'POST',
      data: {
        email: emailTyped,
        password: passwordTyped,
      },
    };

    setLoading(true);
    setErrorRequest('');

    axios(data)
      .then((res) => {
        const { user, token, subscription } = res.data;

        if (!user || !token) {
          setLoading(false);
          return setErrorRequest('Respuesta inválida del servidor');
        }

        // Guardar token en cookie y localStorage
        Cookies.set('token', token, { 
          expires: 7,
          sameSite: 'lax',
          path: '/'
        });
        Cookies.set('accessToken', token, { 
          expires: 7,
          sameSite: 'lax',
          path: '/'
        });
        
        // También guardar en localStorage como backup
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('iphones', JSON.stringify([]));
        
        // Guardar info de suscripción
        if (subscription) {
          localStorage.setItem('subscription', JSON.stringify(subscription));
        }
        
        // Guardar nombre del tenant para mostrar en login
        if (user.tenant?.name) {
          localStorage.setItem('tenantName', user.tenant.name);
        }
        
        // Guardar logo del tenant
        if (user.tenant?.customLogo) {
          localStorage.setItem('tenantLogo', user.tenant.customLogo);
        } else {
          localStorage.removeItem('tenantLogo');
        }
        
        // Guardar locale del tenant - esto determina el idioma del sistema
        if (user.tenant?.locale) {
          localStorage.setItem('app_locale', user.tenant.locale);
          localStorage.setItem('language_set', 'true');
        }

        // Guardar modelos ocultos del tenant
        if (user.tenant?.hiddenModels) {
          try {
            localStorage.setItem('hiddenModels', user.tenant.hiddenModels);
          } catch {
            localStorage.setItem('hiddenModels', '[]');
          }
        }

        // Guardar categorías ocultas del tenant (ahora son productos de accesorios)
        if (user.tenant?.hiddenCategories) {
          try {
            localStorage.setItem('hiddenAccessories', user.tenant.hiddenCategories);
          } catch {
            localStorage.setItem('hiddenAccessories', '[]');
          }
        }
        
        dispatch({
          payload: { user },
          type: UserTypes.USER_SUCCESS,
        });

        if (rememberEmailValue === 'true') {
          localStorage.setItem('rememberEmail', emailTyped);
        }

        // Redirigir
        const redirect = params.get('redirect');
        
        // Si es SuperAdmin, redirigir al panel exclusivo
        if (user.role === 'SUPER_ADMIN') {
          window.location.href = '/panel';
        } else {
          window.location.href = redirect || '/inicio';
        }
      })
      .catch((err) => {
        setLoading(false);
        if (err.response?.status === 401) {
          return setErrorRequest('Email o contraseña inválido');
        }
        setErrorRequest('Error en el sistema');
      });
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    // Solo cargar si es un email válido (no "false" ni vacío)
    if (savedEmail && savedEmail !== 'false' && savedEmail.includes('@') && emailRef.current) {
      emailRef.current.value = savedEmail;
      setRememberEmail(savedEmail);
    }
    
    // Cargar nombre del tenant si existe
    const savedTenantName = localStorage.getItem('tenantName');
    if (savedTenantName) {
      setTenantName(savedTenantName);
    }
    
    // Cargar logo del tenant si existe
    const savedTenantLogo = localStorage.getItem('tenantLogo');
    if (savedTenantLogo) {
      setTenantLogo(savedTenantLogo);
    }
    
    // Verificar si viene del registro con locale en URL
    const localeParam = params.get('locale');
    const currentLocale = localStorage.getItem('app_locale');
    
    // Solo actualizar y recargar si el locale cambió y no es el mismo que ya está guardado
    if (localeParam && localeParam !== currentLocale) {
      localStorage.setItem('app_locale', localeParam);
      localStorage.setItem('language_set', 'true');
      
      // Remover el parámetro locale de la URL y recargar
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('locale');
        window.history.replaceState({}, '', url.toString());
        window.location.reload();
      }
    }
  }, [params]);

  return (
    <section className='min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950'>
      <div className='w-full max-w-md mx-4'>
        {/* Card principal */}
        <div className='bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 md:p-10'>
          {/* Logo y título */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center mb-4'>
              {tenantLogo ? (
                /* Logo personalizado del tenant */
                <img
                  src={tenantLogo}
                  alt='Logo'
                  className='w-16 h-16 object-contain'
                />
              ) : (
                <>
                  {/* Logo Clodeb - cambia según tema */}
                  <Image
                    src={'/images/logo-dark.svg'}
                    width={64}
                    height={64}
                    alt='Clodeb'
                    className='dark:hidden'
                  />
                  <Image
                    src={'/images/logo-white.svg'}
                    width={64}
                    height={64}
                    alt='Clodeb'
                    className='hidden dark:block'
                  />
                </>
              )}
            </div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2'>
              {tenantName 
                ? (localStorage.getItem('app_locale') === 'en' ? `Welcome to ${tenantName}` : `Bienvenido a ${tenantName}`)
                : t('auth.loginTitle')}
            </h1>
            <p className='text-gray-600 dark:text-zinc-400 text-sm'>
              {localStorage.getItem('app_locale') === 'en' ? 'Sign in to your account' : 'Iniciá sesión en tu cuenta'}
            </p>
          </div>

          {/* Formulario */}
          <form className='space-y-5' onSubmit={handleLogIn} autoComplete='on'>
            {/* Email */}
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium text-gray-700 dark:text-zinc-300'>
                {t('auth.email')}
              </Label>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='username email'
                className='h-11 border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 focus:border-gray-900 dark:focus:border-zinc-500 focus:ring-gray-900 dark:focus:ring-zinc-500 rounded-lg'
                placeholder='ejemplo@correo.com'
                required
                ref={emailRef}
              />
              <div className='flex items-center gap-2 mt-2'>
                <Checkbox id='rememberEmail' ref={rememberEmailRef} />
                <Label
                  htmlFor='rememberEmail'
                  className='text-sm text-gray-600 dark:text-zinc-400 font-normal cursor-pointer'
                >
                  {t('auth.rememberMe')}
                </Label>
              </div>
            </div>

            {/* Contraseña */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password' className='text-sm font-medium text-gray-700 dark:text-zinc-300'>
                  {t('auth.password')}
                </Label>
                <a href='/olvide-password' className='text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors'>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  className='h-11 border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 focus:border-gray-900 dark:focus:border-zinc-500 focus:ring-gray-900 dark:focus:ring-zinc-500 rounded-lg pr-11'
                  placeholder='••••••••'
                  required
                  ref={passwordRef}
                />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors'
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOffIcon className='w-5 h-5' />
                  ) : (
                    <EyeIcon className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorRequest && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                <p className='text-red-600 text-sm font-medium text-center'>
                  {errorRequest}
                </p>
              </div>
            )}

            {/* Botón */}
            <Button 
              className='w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl mt-6' 
              type='submit' 
              disabled={loading}
            >
              {loading ? (
                <div className='flex items-center justify-center gap-2'>
                  <LoaderCircleIcon className='w-5 h-5 animate-spin' />
                  <span>{t('common.loading')}</span>
                </div>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className='text-center mt-6'>
          <p className='text-sm text-gray-500 dark:text-zinc-500'>
            © 2023 Clodeb Management System
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
