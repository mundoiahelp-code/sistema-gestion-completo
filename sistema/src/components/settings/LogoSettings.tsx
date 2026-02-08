'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/i18n/I18nProvider';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

export default function LogoSettings() {
  const { locale } = useTranslation();
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar logo actual
  useState(() => {
    const loadLogo = async () => {
      try {
        const token = Cookies.get('token') || Cookies.get('accessToken');
        const res = await axios.get(`${API_URL}/tenants/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.tenant?.customLogo) {
          setLogo(res.data.tenant.customLogo);
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error(locale === 'es' ? 'Solo se permiten imágenes' : 'Only images are allowed');
      return;
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(locale === 'es' ? 'La imagen no puede superar 2MB' : 'Image cannot exceed 2MB');
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (base64Logo: string) => {
    setUploading(true);
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const res = await axios.post(
        `${API_URL}/tenants/current/logo`,
        { logo: base64Logo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.customLogo) {
        setLogo(res.data.customLogo);
        // Actualizar localStorage para que se refleje en el sidebar
        const tenantName = localStorage.getItem('tenantName');
        localStorage.setItem('tenantLogo', res.data.customLogo);
        window.dispatchEvent(new Event('storage'));
        toast.success(locale === 'es' ? 'Logo actualizado exitosamente' : 'Logo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(locale === 'es' ? 'Error al subir el logo' : 'Error uploading logo');
    } finally {
      setUploading(false);
    }
  };

  const deleteLogo = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      await axios.delete(`${API_URL}/tenants/current/logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogo(null);
      localStorage.removeItem('tenantLogo');
      window.dispatchEvent(new Event('storage'));
      toast.success(locale === 'es' ? 'Logo eliminado exitosamente' : 'Logo deleted successfully');
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error(locale === 'es' ? 'Error al eliminar el logo' : 'Error deleting logo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ImageIcon className='h-5 w-5' />
          {locale === 'es' ? 'Logo del Negocio' : 'Business Logo'}
        </CardTitle>
        <CardDescription>
          {locale === 'es' 
            ? 'Personalizá el logo que aparece en el sistema' 
            : 'Customize the logo that appears in the system'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex flex-col md:flex-row gap-6 items-start'>
          {/* Preview del logo */}
          <div className='flex flex-col items-center gap-3'>
            <div className='w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50'>
              {logo ? (
                <div className='relative w-full h-full p-2'>
                  <Image
                    src={logo}
                    alt='Logo'
                    fill
                    className='object-contain'
                  />
                </div>
              ) : (
                <ImageIcon className='w-12 h-12 text-muted-foreground/50' />
              )}
            </div>
            <p className='text-xs text-muted-foreground text-center'>
              {locale === 'es' ? 'Vista previa' : 'Preview'}
            </p>
          </div>

          {/* Controles */}
          <div className='flex-1 space-y-4'>
            <div className='space-y-2'>
              <p className='text-sm font-medium'>
                {locale === 'es' ? 'Subir logo' : 'Upload logo'}
              </p>
              <p className='text-xs text-muted-foreground'>
                {locale === 'es' 
                  ? 'Formatos: PNG, JPG, SVG. Tamaño máximo: 2MB. Recomendado: 200x200px' 
                  : 'Formats: PNG, JPG, SVG. Max size: 2MB. Recommended: 200x200px'}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />

            <div className='flex gap-2'>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant='outline'
              >
                {uploading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    {locale === 'es' ? 'Subiendo...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className='h-4 w-4 mr-2' />
                    {logo 
                      ? (locale === 'es' ? 'Cambiar logo' : 'Change logo')
                      : (locale === 'es' ? 'Subir logo' : 'Upload logo')
                    }
                  </>
                )}
              </Button>

              {logo && (
                <Button
                  onClick={deleteLogo}
                  disabled={loading}
                  variant='destructive'
                >
                  {loading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <X className='h-4 w-4 mr-2' />
                      {locale === 'es' ? 'Eliminar' : 'Delete'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
