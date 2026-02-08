'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/helpers/formatDate';
import { useTranslation } from '@/i18n/I18nProvider';
import { translateColor } from '@/helpers/translateColor';
import { IPhone } from '@/interfaces/schemas.interfaces';
import {
  BadgeCheckIcon,
  BuildingIcon,
  LucideIcon,
  StoreIcon,
  WarehouseIcon,
  XIcon,
  ArrowRightLeft,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  data: IPhone & { store: { id: string; icon: string; name: string } };
}

export default function Product({ data }: Props) {
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [currentStore, setCurrentStore] = useState(data.store);
  const { t, locale } = useTranslation();

  // Cargar sucursales
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = Cookies.get('accessToken');
        const res = await axios.get(`${API}/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data.stores || res.data || []);
      } catch (error) {
        console.error('Error cargando sucursales:', error);
      }
    };
    fetchStores();
  }, []);

  // Trasladar producto
  const handleTransfer = async () => {
    if (!selectedStore || selectedStore === currentStore.id) return;
    
    setTransferring(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.post(
        `${API}/products/transfer`,
        {
          imei: data.imei,
          productId: data.id,
          targetStoreId: selectedStore,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newStore = stores.find(s => s.id === selectedStore);
      if (newStore) {
        setCurrentStore({ ...currentStore, id: newStore.id, name: newStore.name });
      }
      
      toast.success(locale === 'es' ? 'Producto trasladado correctamente' : 'Product transferred successfully');
      setShowTransfer(false);
      setSelectedStore('');
    } catch (error: any) {
      console.error('Error trasladando:', error);
      toast.error(error.response?.data?.error || (locale === 'es' ? 'Error al trasladar' : 'Error transferring'));
    } finally {
      setTransferring(false);
    }
  };

  const MAIN_INFO = [
    { name: t('products.imei'), value: data.imei },
    { name: t('products.model'), value: data.model },
    { name: t('products.color'), value: translateColor(data.color, locale) },
    { name: t('products.storage'), value: data.storage },
    { name: t('products.battery'), value: data.battery + '%' },
    { name: t('products.price'), value: '$' + data.price },
    { name: locale === 'es' ? 'Detalles' : 'Details', value: data.details || '-' },
  ];

  const iconRef: { [key: string]: LucideIcon } = {
    store: StoreIcon,
    building: BuildingIcon,
    warehouse: WarehouseIcon,
  };

  const IconStore = () => {
    const IconUsed = iconRef[data.store.icon];

    return <IconUsed className='stroke-1 h-5 w-5' />;
  };

  const Status = () => {
    if (data.reserved) return <>{locale === 'es' ? 'Reservado' : 'Reserved'}</>;
    if (data.selled) return <>{locale === 'es' ? 'Vendido' : 'Sold'}</>;

    return (
      <>
        {locale === 'es' ? 'Se encuentra en' : 'Located at'} &quot;{currentStore.name}
        <IconStore />
        &quot;
      </>
    );
  };

  const addDays = (actual: Date, days: number) => {
    const date = new Date(actual);
    date.setDate(date.getDate() + days);
    return date;
  };

  const hasStillWarranty = (dateSelled: Date) => {
    const endWarranty = addDays(new Date(dateSelled), 30).getTime();
    const currDate = new Date().getTime();

    return endWarranty - currDate > 0;
  };

  return (
    <div className='grid lg:grid-cols-4 gap-3'>
      <div className='col-span-4 lg:col-span-2'>
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'es' ? 'Información' : 'Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {MAIN_INFO.map((item, i) => (
                <li className='grid grid-cols-3 items-center' key={i}>
                  <span className='text-gray-600 text-sm'>{item.name}</span>
                  <span className='col-span-2 '>{item.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className='col-span-4 lg:col-span-2'>
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'es' ? 'Estado actual' : 'Current Status'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className='flex items-center font-normal text-sm'>
              <Status />
            </p>
            
            {/* Botón de traslado rápido - solo si no está vendido ni reservado */}
            {!data.selled && !data.reserved && (
              <div className="pt-2 border-t border-zinc-700">
                {!showTransfer ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowTransfer(true)}
                    className="w-full"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {locale === 'es' ? 'Trasladar a otra sucursal' : 'Transfer to another store'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={locale === 'es' ? 'Seleccionar sucursal destino' : 'Select target store'} />
                      </SelectTrigger>
                      <SelectContent>
                        {stores
                          .filter(s => s.id !== currentStore.id)
                          .map(store => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setShowTransfer(false); setSelectedStore(''); }}
                        className="flex-1"
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleTransfer}
                        disabled={!selectedStore || transferring}
                        className="flex-1"
                      >
                        {transferring ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        {t('common.confirm')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.selled && (
        <div className='col-span-4 lg:col-span-2'>
          <Card>
            <CardContent>
              {hasStillWarranty(data.date_selled) ? (
                // Still warranty
                <div className='flex items-center gap-2'>
                  <BadgeCheckIcon className='text-green-600 h-10 w-10 stroke-1' />
                  <span className='font-medium text-lg'>
                    {locale === 'es' ? 'El celular sigue en garantía' : 'Phone is still under warranty'}
                  </span>
                </div>
              ) : (
                // No warranty
                <div className='flex items-center gap-2'>
                  <XIcon className='text-red-600 h-10 w-10 stroke-1' />
                  <span className='font-medium text-lg'>
                    {locale === 'es' ? 'El celular ya no sigue en garantía' : 'Phone warranty has expired'}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className='p-0'>
              <p className='text-sm'>
                {locale === 'es' ? 'Vendido el' : 'Sold on'}{' '}
                {formatDate(data.date_selled, locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </CardFooter>
          </Card>
        </div>
      )}

      {data.movements && data.movements.length > 0 && (
        <div className='col-span-4 lg:col-span-2 col-start-1'>
          <Card>
            <CardTitle>{locale === 'es' ? 'Movimientos' : 'Movements'}</CardTitle>
            <CardContent>
              <ul>
                {data.movements.map((mve, i) => (
                  <li key={i} className='text-sm mt-2'>
                    {mve}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
