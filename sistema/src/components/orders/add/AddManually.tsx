'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useField from '@/hooks/useField';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  addOne: (imei: string) => void;
}

export default function AddManually({ addOne }: Props) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const imei = useField({ type: 'text', validation: /^[0-9]*$/ });

  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [imeiInfo, setImeiInfo] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Buscar info del IMEI cuando se completan 15 dígitos
  useEffect(() => {
    if (imei.value.length === 15) {
      lookupImei(imei.value);
    } else {
      setImeiInfo(null);
      setShowConfirmation(false);
    }
  }, [imei.value]);

  const lookupImei = async (imeiValue: string) => {
    setLookingUp(true);
    setError('');
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${API}/products/imei/${imeiValue}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { found, data } = response.data;
      
      if (found && data) {
        setImeiInfo(data);
        setShowConfirmation(true);
      } else {
        setError(isSpanish ? 'IMEI no reconocido. Verificá que esté correcto.' : 'IMEI not recognized. Please verify.');
      }
    } catch (error) {
      console.error('Error looking up IMEI:', error);
      setError(isSpanish ? 'Error al buscar IMEI' : 'Error looking up IMEI');
    } finally {
      setLookingUp(false);
    }
  };

  const handleAddManually = () => {
    if (imei.value.length !== 15) {
      return setError(isSpanish ? 'El IMEI debe tener 15 dígitos' : 'IMEI must have 15 digits');
    }

    addOne(imei.value);
    setOpenDialog(false);
    imei.onChange('');
    setError('');
    setImeiInfo(null);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    imei.onChange('');
    setError('');
    setImeiInfo(null);
    setShowConfirmation(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.replace(/\D/g, '').slice(0, 15);
      imei.onChange(cleanText);
      if (cleanText.length === 15) {
        setError('');
      }
    } catch (err) {
      console.error('Error al pegar:', err);
    }
  };

  return (
    <p className='text-center text-base text-zinc-400 font-light'>
      {isSpanish 
        ? 'Para agregar un producto escanea su IMEI o manualmente haciendo '
        : 'To add a product scan its IMEI or manually by '}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger className='underline'>
          {isSpanish ? 'Click Aquí' : 'Clicking Here'}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            {isSpanish ? 'Agregar IMEI manualmente' : 'Add IMEI Manually'}
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                {...imei}
                placeholder='012345678901234'
                maxLength={15}
                className='flex-1'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && imei.value.length === 15 && showConfirmation) {
                    handleAddManually();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={handlePaste}
                type="button"
              >
                📋 Pegar
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {imei.value.length}/15 dígitos
              </p>
              {lookingUp && (
                <span className="text-xs text-blue-600 animate-pulse">
                  🔍 Buscando...
                </span>
              )}
              {imei.value.length === 15 && !lookingUp && imeiInfo && (
                <span className="text-xs text-green-600">
                  ✅ IMEI reconocido
                </span>
              )}
            </div>

            {/* Cuadro de confirmación */}
            {showConfirmation && imeiInfo && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                  ✅ {isSpanish ? 'IMEI Encontrado' : 'IMEI Found'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{isSpanish ? 'Modelo' : 'Model'}:</p>
                    <p className="font-semibold">{imeiInfo.model || 'N/A'}</p>
                  </div>
                  {imeiInfo.storage && (
                    <div>
                      <p className="text-muted-foreground text-xs">{isSpanish ? 'Capacidad' : 'Storage'}:</p>
                      <p className="font-semibold">{imeiInfo.storage}</p>
                    </div>
                  )}
                  {imeiInfo.color && (
                    <div>
                      <p className="text-muted-foreground text-xs">{isSpanish ? 'Color' : 'Color'}:</p>
                      <p className="font-semibold">{imeiInfo.color}</p>
                    </div>
                  )}
                  {imeiInfo.exists && (
                    <div className="col-span-2">
                      <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                        ⚠️ {isSpanish ? 'Este IMEI ya existe en' : 'This IMEI already exists in'} {imeiInfo.store}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {isSpanish ? '¿Es correcto? Confirmá para continuar.' : 'Is this correct? Confirm to continue.'}
                </p>
              </div>
            )}

            {!showConfirmation && imei.value.length < 15 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs">
                <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  💡 Tip rápido:
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  1. Abrí la cámara del iPhone<br/>
                  2. Apuntá al código de barras<br/>
                  3. Tocá el número que aparece arriba<br/>
                  4. Copialo<br/>
                  5. Volvé acá y hacé click en "Pegar"
                </p>
              </div>
            )}
          </div>
          {error && <p className='text-sm text-red-600'>* {error}</p>}
          <DialogFooter className="gap-2">
            {showConfirmation && (
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
              >
                {isSpanish ? 'Cancelar' : 'Cancel'}
              </Button>
            )}
            <Button 
              onClick={handleAddManually} 
              disabled={imei.value.length !== 15 || !showConfirmation || lookingUp}
            >
              {isSpanish ? 'Confirmar y Agregar' : 'Confirm and Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </p>
  );
}
