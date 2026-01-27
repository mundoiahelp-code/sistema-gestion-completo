'use client';

import { useEffect, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

interface ScanResult {
  found: boolean;
  source: 'database' | 'tac' | null;
  data: {
    model?: string;
    color?: string;
    storage?: string;
    battery?: number;
    price?: number;
    cost?: number;
    exists?: boolean;
    productId?: string;
    store?: string;
    storeId?: string;
    reserved?: number;
    stock?: number;
    condition?: string;
    name?: string;
  } | null;
}

interface UseImeiScannerOptions {
  onScan?: (imei: string, result: ScanResult) => void;
  enabled?: boolean;
}

export function useImeiScanner(options: UseImeiScannerOptions = {}) {
  const { onScan, enabled = true } = options;
  const pathname = usePathname();
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const lookupImei = useCallback(async (imei: string): Promise<ScanResult> => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products/imei/${imei}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return { found: false, source: null, data: null };
    }
  }, []);

  const handleImeiScanned = useCallback(async (imei: string) => {
    const result = await lookupImei(imei);
    
    if (onScan) {
      onScan(imei, result);
      return;
    }

    // Lógica por defecto según la sección
    if (pathname.includes('/celulares') || pathname.includes('/productos')) {
      // Página de productos/stock
      if (result.found && result.data?.exists) {
        const productInfo = `${result.data.model} ${result.data.storage || ''} ${result.data.color || ''}`;
        toast.success(`✅ Encontrado: ${productInfo}`, {
          description: `Stock: ${result.data.stock} | Precio: $${result.data.price?.toLocaleString()}`,
          duration: 4000
        });
        window.dispatchEvent(new CustomEvent('imei-scanned-producto', { 
          detail: { imei, product: result.data } 
        }));
      } else if (result.found) {
        toast.info(`📱 IMEI reconocido: ${result.data?.model || 'iPhone'} - No está en stock`);
      } else {
        toast.error('❌ IMEI no reconocido');
      }
    } else if (pathname.includes('/ingresos')) {
      // Página de ingresos
      if (result.found && result.data?.exists) {
        toast.error(`⚠️ Este IMEI ya existe en el sistema`, {
          description: `${result.data.model} - ${result.data.store}`,
          duration: 5000
        });
      } else if (result.found) {
        toast.success(`✅ IMEI reconocido: ${result.data?.model} - Listo para ingresar`);
        window.dispatchEvent(new CustomEvent('imei-scanned-ingreso', { 
          detail: { imei, model: result.data?.model } 
        }));
      } else {
        toast.info('📝 IMEI no reconocido - Ingresá los datos manualmente');
        window.dispatchEvent(new CustomEvent('imei-scanned-ingreso', { 
          detail: { imei, model: null } 
        }));
      }
    } else if (pathname.includes('/ventas')) {
      // Página de ventas
      if (result.found && result.data?.exists) {
        if ((result.data.reserved || 0) > 0) {
          toast.warning(`🔒 ${result.data.model} está reservado para un turno`);
        } else {
          const productInfo = `${result.data.model} ${result.data.storage || ''} ${result.data.color || ''}`;
          toast.success(`✅ Agregado: ${productInfo}`, {
            description: `Precio: $${result.data.price?.toLocaleString()}`,
            duration: 3000
          });
        }
        window.dispatchEvent(new CustomEvent('imei-scanned-venta', { 
          detail: { imei, product: result.data } 
        }));
      } else {
        toast.error('❌ Producto no encontrado en stock - Ingresalo primero');
      }
    } else if (pathname.includes('/turnos')) {
      // Página de turnos
      if (result.found && result.data) {
        toast.info(`🔍 Buscando turnos con ${result.data.model}...`);
        window.dispatchEvent(new CustomEvent('imei-scanned-turno', { 
          detail: { imei, product: result.data } 
        }));
      } else {
        toast.error('❌ Producto no reconocido');
      }
    } else {
      // Otras páginas - solo mostrar info
      if (result.found && result.data) {
        const status = result.data.exists 
          ? (result.data.reserved ? '🔒 Reservado' : '✅ En stock') 
          : '❌ No en stock';
        const productInfo = `${result.data.model || 'iPhone'} ${result.data.storage || ''}`;
        toast.info(`${productInfo} - ${status}`, {
          description: result.data.exists ? `Sucursal: ${result.data.store}` : undefined,
          duration: 4000
        });
      } else {
        toast.error('❌ IMEI no reconocido');
      }
    }
  }, [pathname, onScan, lookupImei]);

  useEffect(() => {
    if (!enabled) return;

    let currentBuffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está en un input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      
      // Si pasó mucho tiempo, resetear buffer
      if (now - lastKeyTime > 100) {
        currentBuffer = '';
      }
      setLastKeyTime(now);

      // Solo números
      if (/^\d$/.test(e.key)) {
        currentBuffer += e.key;
        setBuffer(currentBuffer);

        // Limpiar timeout anterior
        clearTimeout(timeout);

        // Si tenemos 15 dígitos, es un IMEI
        if (currentBuffer.length === 15) {
          handleImeiScanned(currentBuffer);
          currentBuffer = '';
          setBuffer('');
        } else {
          // Timeout para resetear si no se completa
          timeout = setTimeout(() => {
            currentBuffer = '';
            setBuffer('');
          }, 500);
        }
      }

      // Enter también puede indicar fin de escaneo
      if (e.key === 'Enter' && currentBuffer.length === 15) {
        handleImeiScanned(currentBuffer);
        currentBuffer = '';
        setBuffer('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [enabled, lastKeyTime, handleImeiScanned]);

  return { buffer, lookupImei };
}
