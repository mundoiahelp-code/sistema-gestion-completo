'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { API } from '@/config/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Package, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  price: number;
  stock: number;
  condition: string;
  battery?: number;
  store: {
    id: string;
    name: string;
  };
}

export default function GlobalScanner() {
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Detectar escaneo de código de barras
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input/textarea (excepto si es un scanner rápido)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      const now = Date.now();
      const timeDiff = now - lastKeyTime;

      // Si es Enter y hay buffer, procesar
      if (e.key === 'Enter' && buffer.length >= 10) {
        e.preventDefault();
        searchByImei(buffer.trim());
        setBuffer('');
        return;
      }

      // Si es un número o letra, agregar al buffer
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Si pasó más de 100ms desde la última tecla, resetear buffer (escritura manual)
        // Si es menos de 100ms, es un scanner (escribe muy rápido)
        if (timeDiff > 100 && buffer.length > 0) {
          setBuffer(e.key);
        } else {
          setBuffer(prev => prev + e.key);
        }
        setLastKeyTime(now);

        // Auto-buscar si el buffer tiene 15 caracteres (IMEI típico)
        if (buffer.length + 1 === 15) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            searchByImei(buffer + e.key);
            setBuffer('');
          }, 50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [buffer, lastKeyTime]);

  const searchByImei = async (imei: string) => {
    if (imei.length < 10) return;

    setSearching(true);
    setShowDialog(true);

    try {
      const token = Cookies.get('token');
      const res = await axios.get(`${API}/products?imei=${imei}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const products = res.data.products || res.data || [];
      const foundProduct = products.find((p: Product) => p.imei === imei);

      if (foundProduct) {
        setProduct(foundProduct);
        handleProductFound(foundProduct);
      } else {
        setProduct(null);
        toast.error(`No se encontró producto con IMEI: ${imei}`);
        setTimeout(() => setShowDialog(false), 2000);
      }
    } catch (error) {
      console.error('Error searching IMEI:', error);
      toast.error('Error al buscar el producto');
      setShowDialog(false);
    } finally {
      setSearching(false);
    }
  };

  const handleProductFound = (product: Product) => {
    const path = pathname;

    // En página de productos: resaltar el producto
    if (path.includes('/celulares') || path.includes('/productos')) {
      toast.success(`Producto encontrado: ${product.name}`);
      // Disparar evento para que la lista lo resalte
      window.dispatchEvent(new CustomEvent('productScanned', { detail: product }));
      setTimeout(() => setShowDialog(false), 2000);
    }
    
    // En página de ventas: agregar a la venta
    else if (path.includes('/ventas')) {
      if (product.stock > 0) {
        window.dispatchEvent(new CustomEvent('addProductToSale', { detail: product }));
        toast.success(`${product.name} agregado a la venta`);
        setTimeout(() => setShowDialog(false), 1500);
      } else {
        toast.error('Producto sin stock');
        setTimeout(() => setShowDialog(false), 2000);
      }
    }
    
    // En cualquier otro lado: mostrar info y opción de ir al producto
    else {
      // El diálogo se queda abierto para que el usuario decida qué hacer
    }
  };

  const goToProduct = () => {
    if (product) {
      router.push(`/celulares?highlight=${product.id}`);
      setShowDialog(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Escáner de IMEI
          </DialogTitle>
          <DialogDescription>
            {searching ? 'Buscando producto...' : product ? 'Producto encontrado' : 'No encontrado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {searching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!searching && product && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {product.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {product.model} - {product.storage} - {product.color}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">IMEI</p>
                  <p className="font-mono font-semibold">{product.imei}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Precio</p>
                  <p className="font-semibold">${product.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-semibold">{product.stock}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Condición</p>
                  <p className="font-semibold">{product.condition}</p>
                </div>
                {product.battery && (
                  <div>
                    <p className="text-muted-foreground">Batería</p>
                    <p className="font-semibold">{product.battery}%</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Sucursal</p>
                  <p className="font-semibold">{product.store.name}</p>
                </div>
              </div>

              {!pathname.includes('/celulares') && !pathname.includes('/ventas') && (
                <Button onClick={goToProduct} className="w-full">
                  Ver en Celulares
                </Button>
              )}
            </div>
          )}

          {!searching && !product && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Producto no encontrado
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  El IMEI escaneado no existe en el sistema
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
