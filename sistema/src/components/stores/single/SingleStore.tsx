'use client';

import axios, { AxiosRequestConfig } from 'axios';
import {
  BuildingIcon,
  ForwardIcon,
  LoaderCircleIcon,
  LucideIcon,
  StoreIcon,
  WarehouseIcon,
  XIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import LoadingPage from '@/components/layout/LoadingPage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API } from '@/config/api';
import { toTitleCase } from '@/helpers/toTitleCase';
import useCookie from '@/hooks/useCookie';
import useSonner from '@/hooks/useSonner';
import useStores from '@/hooks/useStores';
import { useTranslation } from '@/i18n/I18nProvider';
import { IPhone } from '@/interfaces/schemas.interfaces';
import Scan from './Scan';
import StoreEdit from './StoreEdit';

interface StoreData {
  id: string;
  name: string;
  icon: string;
  address?: string;
  phone?: string;
  mondayHours?: string | null;
  tuesdayHours?: string | null;
  wednesdayHours?: string | null;
  thursdayHours?: string | null;
  fridayHours?: string | null;
  saturdayHours?: string | null;
  sundayHours?: string | null;
  appointmentDuration?: number;
  googleMapsUrl?: string | null;
}

interface Accessory {
  id: string;
  name: string;
  stock: number;
}

interface Props {
  data: {
    store: StoreData;
    phones: IPhone[];
    accessories?: Accessory[];
  };
  onDataChange?: () => void;
}

export default function SingleStore({ data, onDataChange }: Props) {
  const { stores, loadingStores } = useStores();
  const [accessToken, setAccessToken] = useCookie('accessToken', false);
  const { handleErrorSonner, handleSuccessSonner } = useSonner();
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [loadingEditStore, setLoadingEditStore] = useState(false);
  const [itemsStore, setItemsStore] = useState<IPhone[]>(data.phones);
  const [loading, setLoading] = useState(false);
  const [itemsMove, setItemsMove] = useState<IPhone[]>([]);
  const [storeToMove, setStoreToMove] = useState('');
  
  // Estados para accesorios
  const [accessories, setAccessories] = useState(data.accessories || []);
  const [accessoryMoveQty, setAccessoryMoveQty] = useState<Record<string, number>>({});

  const iconRef: { [key: string]: LucideIcon } = {
    store: StoreIcon,
    building: BuildingIcon,
    warehouse: WarehouseIcon,
  };

  if (loadingStores) return <LoadingPage />;

  const Icon = ({ name }: { name: string }) => {
    const IconUsed = iconRef[name];

    return <IconUsed className='' />;
  };

  const handleMove = (data: IPhone, index: number) => {
    if (loading) return;
    if (!storeToMove) return;

    setItemsStore((prev) => {
      const items = [...prev];

      items.splice(index, 1);
      return [...items];
    });
    setItemsMove((prev) => {
      return [...prev, data];
    });
  };

  const moveAgain = (data: IPhone, index: number) => {
    if (loading) return;
    setItemsMove((prev) => {
      const items = [...prev];

      items.splice(index, 1);
      return [...items];
    });
    setItemsStore((prev) => {
      return [data, ...prev];
    });
  };

  const handleMoveImei = (imei: string) => {
    if (loading) return;
    if (!storeToMove) return;

    const phoneIndex = itemsStore.findIndex((x) => String(x.imei) === imei);

    if (phoneIndex === -1) return;

    const data = itemsStore[phoneIndex];

    setItemsStore((prev) => {
      const items = [...prev];
      items.splice(phoneIndex, 1);
      return [...items];
    });
    setItemsMove((prev) => {
      return [...prev, data];
    });
  };

  const handleStoreToMove = (val: string) => {
    if (loading) return;
    if (val === '') {
      setItemsMove([]);
      setItemsStore(data.phones);
    }

    setStoreToMove(val);
  };

  const handleMoveItems = () => {
    if (storeToMove && itemsMove.length > 0) {
      const config: AxiosRequestConfig = {
        url: `${API}/phone/move_store`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          ids: itemsMove.map((x) => x.id),
          storeIdDestiny: storeToMove,
        },
      };

      setLoadingEditStore(true);
      axios(config)
        .then(() => {
          handleSuccessSonner(locale === 'es' ? 'Celulares trasladados correctamente!' : 'Phones transferred successfully!');
          router.push('/tiendas');
          router.refresh();
        })
        .catch((err) => {
          console.log(err);
          handleErrorSonner(t('stores.errorTransferring'));
        })
        .finally(() => setLoadingEditStore(false));
    }
  };

  const handleEditStore = (storeData: any) => {
    if (!storeData.name) return;

    const config: AxiosRequestConfig = {
      url: `${API}/stores/${data.store.id}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: storeData,
    };

    setLoadingEditStore(true);
    axios(config)
      .then((res) => {
        const response = res.data;
        if (response.errors) {
          const err = response.errors;
          if (err.msg === 'Name is required')
            return handleErrorSonner(t('stores.nameRequired'));
        }

        handleSuccessSonner(t('stores.storeUpdated'));
        
        // Recargar datos de la sucursal
        if (onDataChange) {
          onDataChange();
        } else {
          router.refresh();
        }
      })
      .catch((err) => {
        console.log(err);
        handleErrorSonner(t('stores.errorUpdating'));
      })
      .finally(() => setLoadingEditStore(false));
  };

  return (
    <div className={twMerge(loading ? 'max-h-[calc(100vh-10rem)] overflow-hidden' : '')}>
      {loading && (
        <div className='fixed inset-0 bg-white/50 flex justify-center items-center z-50'>
          <LoaderCircleIcon className='h-8 w-8 animate-spin' />
        </div>
      )}
      
      {/* Header de la tienda */}
      <Card className='flex justify-between items-center w-full mb-4 p-4'>
        <div className='flex items-center gap-2'>
          <Icon name={data.store.icon} />
          <div>
            <h2 className='font-medium'>{data.store.name}</h2>
            {data.store.address && (
              <p className='text-sm text-zinc-500'>{data.store.address}</p>
            )}
          </div>
        </div>
        <StoreEdit
          data={data.store}
          handleEdit={handleEditStore}
          loading={loadingEditStore}
        />
      </Card>

      {/* Selector de tienda destino */}
      <Card className='mb-4'>
        <Label>
          {locale === 'es' ? 'Trasladar productos a' : 'Transfer products to'}
          <div className='flex items-center gap-2 mt-1'>
            <Select value={storeToMove} onValueChange={handleStoreToMove}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'es' ? 'Seleccionar sucursal' : 'Select store'} />
              </SelectTrigger>
              <SelectContent>
                {stores
                  .filter((x) => x.id !== data.store.id)
                  .map((store, i) => (
                    <SelectItem value={store.id} key={i}>
                      {toTitleCase(store.name)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {storeToMove && (
              <Button variant='outline' size='sm' onClick={() => handleStoreToMove('')}>
                <XIcon className='h-4 w-4' />
              </Button>
            )}
          </div>
        </Label>
      </Card>

      <Tabs defaultValue='celulares' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 mb-4'>
          <TabsTrigger value='celulares'>
            {t('nav.phones')} ({itemsStore.length})
          </TabsTrigger>
          <TabsTrigger value='accesorios'>
            {t('nav.accessories')} ({accessories.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Celulares */}
        <TabsContent value='celulares'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Lista de celulares en tienda */}
            <div>
              <h3 className='text-sm font-medium mb-2'>{locale === 'es' ? 'En esta sucursal' : 'In this store'}</h3>
              <Scan addOne={handleMoveImei} />
              {itemsStore.length > 0 ? (
                <Card className='mt-2 max-h-96 overflow-y-auto'>
                  <ul>
                    {itemsStore.map((phone, i) => (
                      <li
                        key={i}
                        className={twMerge(
                          'py-2 border-b px-2 rounded-md',
                          storeToMove ? 'cursor-pointer hover:bg-zinc-100' : ''
                        )}
                        onClick={() => storeToMove && handleMove(phone, i)}
                      >
                        <p className='text-xs text-zinc-400'>{phone.imei}</p>
                        <p className='text-sm'>
                          {phone.model} {phone.color} {phone.storage} {phone.battery}%
                        </p>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : (
                <p className='text-sm text-zinc-400 mt-2'>{locale === 'es' ? 'Sin celulares' : 'No phones'}</p>
              )}
            </div>

            {/* Lista de celulares a trasladar */}
            <div>
              <h3 className='text-sm font-medium mb-2'>
                {locale === 'es' ? 'A trasladar' : 'To transfer'} {itemsMove.length > 0 && `(${itemsMove.length})`}
              </h3>
              {storeToMove && itemsMove.length > 0 ? (
                <>
                  <Card className='max-h-96 overflow-y-auto'>
                    <ul>
                      {itemsMove.map((phone, i) => (
                        <li
                          key={i}
                          className='py-2 border-b px-2 cursor-pointer hover:bg-red-50'
                          onClick={() => moveAgain(phone, i)}
                        >
                          <p className='text-xs text-zinc-400'>{phone.imei}</p>
                          <p className='text-sm'>
                            {phone.model} {phone.color} {phone.storage} {phone.battery}%
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Button className='w-full mt-2' onClick={handleMoveItems} disabled={loading}>
                    {locale === 'es' 
                      ? `Trasladar ${itemsMove.length} celular${itemsMove.length > 1 ? 'es' : ''}`
                      : `Transfer ${itemsMove.length} phone${itemsMove.length > 1 ? 's' : ''}`}
                    <ForwardIcon className='h-4 w-4 ml-2' />
                  </Button>
                </>
              ) : (
                <p className='text-sm text-zinc-400'>
                  {storeToMove 
                    ? (locale === 'es' ? 'Hacé click en un celular para moverlo' : 'Click on a phone to move it')
                    : (locale === 'es' ? 'Seleccioná una sucursal destino' : 'Select a target store')}
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab Accesorios */}
        <TabsContent value='accesorios'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h3 className='text-sm font-medium mb-2'>{locale === 'es' ? 'Accesorios en esta sucursal' : 'Accessories in this store'}</h3>
              {accessories.length > 0 ? (
                <Card className='max-h-96 overflow-y-auto'>
                  <ul>
                    {accessories.map((acc, i) => (
                      <li key={i} className='py-2 border-b px-2'>
                        <div className='flex justify-between items-center'>
                          <div>
                            <p className='text-sm'>{acc.name}</p>
                            <p className='text-xs text-zinc-400'>{locale === 'es' ? 'Stock' : 'Stock'}: {acc.stock} {locale === 'es' ? 'unidades' : 'units'}</p>
                          </div>
                          {storeToMove && acc.stock > 0 && (
                            <div className='flex items-center gap-2'>
                              <Input
                                type='number'
                                min={0}
                                max={acc.stock}
                                value={accessoryMoveQty[acc.id] || 0}
                                onChange={(e) => {
                                  const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), acc.stock);
                                  setAccessoryMoveQty(prev => ({ ...prev, [acc.id]: val }));
                                }}
                                className='w-20 h-8 text-center'
                              />
                              <span className='text-xs text-zinc-400'>/ {acc.stock}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : (
                <p className='text-sm text-zinc-400'>{locale === 'es' ? 'Sin accesorios' : 'No accessories'}</p>
              )}
            </div>

            <div>
              <h3 className='text-sm font-medium mb-2'>{locale === 'es' ? 'Resumen de traslado' : 'Transfer summary'}</h3>
              {storeToMove ? (
                <>
                  {Object.entries(accessoryMoveQty).filter(([_, qty]) => qty > 0).length > 0 ? (
                    <Card>
                      <ul>
                        {Object.entries(accessoryMoveQty)
                          .filter(([_, qty]) => qty > 0)
                          .map(([accId, qty]) => {
                            const acc = accessories.find(a => a.id === accId);
                            return acc ? (
                              <li key={accId} className='py-2 border-b px-2 flex justify-between'>
                                <span className='text-sm'>{acc.name}</span>
                                <span className='text-sm font-medium'>{qty} {locale === 'es' ? 'unidades' : 'units'}</span>
                              </li>
                            ) : null;
                          })}
                      </ul>
                      <Button className='w-full mt-2' disabled={loading}>
                        {locale === 'es' ? 'Trasladar accesorios' : 'Transfer accessories'}
                        <ForwardIcon className='h-4 w-4 ml-2' />
                      </Button>
                    </Card>
                  ) : (
                    <p className='text-sm text-zinc-400'>
                      {locale === 'es' ? 'Ingresá la cantidad a trasladar de cada accesorio' : 'Enter the quantity to transfer for each accessory'}
                    </p>
                  )}
                </>
              ) : (
                <p className='text-sm text-zinc-400'>{locale === 'es' ? 'Seleccioná una sucursal destino' : 'Select a target store'}</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
