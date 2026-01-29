'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import StoreAdd from './StoreAdd';
import useCookie from '@/hooks/useCookie';
import axios, { AxiosRequestConfig } from 'axios';
import { API } from '@/config/api';
import useSonner from '@/hooks/useSonner';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BuildingIcon,
  LucideIcon,
  StoreIcon,
  WarehouseIcon,
  Trash2Icon,
  MapPinIcon,
  PhoneIcon,
  PackageIcon,
  ArrowRightLeftIcon,
  SmartphoneIcon,
  HeadphonesIcon,
  ClockIcon,
  SettingsIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/I18nProvider';

interface Store {
  name: string;
  id: string;
  icon: string;
  phones: number;
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

interface StoreDetail extends Store {
  phonesCount: number;
  accessoriesItems: number;
  accessoriesStock: number;
}

interface Props {
  data: Store[];
}

const getDaysConfig = (t: (key: string) => string) => [
  { key: 'mondayHours', label: t('stores.monday') },
  { key: 'tuesdayHours', label: t('stores.tuesday') },
  { key: 'wednesdayHours', label: t('stores.wednesday') },
  { key: 'thursdayHours', label: t('stores.thursday') },
  { key: 'fridayHours', label: t('stores.friday') },
  { key: 'saturdayHours', label: t('stores.saturday') },
  { key: 'sundayHours', label: t('stores.sunday') },
];

export default function StoresList({ data }: Props) {
  const { t } = useTranslation();
  const DAYS = getDaysConfig(t);
  const [stores, setStores] = useState<Store[]>(data);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferImei, setTransferImei] = useState('');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [targetStoreId, setTargetStoreId] = useState('');
  const [transferType, setTransferType] = useState<'imei' | 'accessory'>('imei');
  const [accessories, setAccessories] = useState<Array<{ id: string; name: string; model?: string; stock: number; storeName?: string; storeId?: string }>>([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [storeDetail, setStoreDetail] = useState<StoreDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Estado para producto encontrado por IMEI
  const [foundProduct, setFoundProduct] = useState<{
    id: string;
    model: string;
    color: string;
    storage: string;
    battery: number;
    storeName: string;
    storeId: string;
  } | null>(null);
  const [searchingImei, setSearchingImei] = useState(false);
  
  // Estados para edición
  const [showConfig, setShowConfig] = useState(false);
  const [editData, setEditData] = useState<Partial<Store>>({});
  const [dayEnabled, setDayEnabled] = useState<Record<string, boolean>>({});
  
  // Estado para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{ id: string; name: string } | null>(null);

  const [accessToken] = useCookie('accessToken', false);
  const { handleErrorSonner, handleSuccessSonner } = useSonner();
  const router = useRouter();

  const handleAdd = (name: string, icon: string) => {
    if (!name) return handleErrorSonner(t('stores.nameRequired'));

    const config: AxiosRequestConfig = {
      url: `${API}/stores`,
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name, icon: icon || 'store' },
    };

    setLoading(true);
    axios(config)
      .then((res) => {
        const response = res.data;
        if (response.error) return handleErrorSonner(response.error);
        handleSuccessSonner(t('stores.storeAdded'));
        const newStore: Store = {
          id: response.store.id,
          name: response.store.name,
          icon: response.store.icon || 'store',
          phones: 0,
        };
        setStores(prev => [...prev, newStore]);
        setOpen(false);
      })
      .catch((err) => {
        handleErrorSonner(err.response?.data?.error || t('stores.errorAddingStore'));
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = (storeId: string, storeName: string) => {
    setStoreToDelete({ id: storeId, name: storeName });
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (!storeToDelete) return;

    const config: AxiosRequestConfig = {
      url: `${API}/stores/${storeToDelete.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    setLoading(true);
    axios(config)
      .then(() => {
        handleSuccessSonner(t('stores.storeDeleted'));
        setStores(prev => prev.filter(s => s.id !== storeToDelete.id));
        setSelectedStore(null);
        setShowDeleteConfirm(false);
        setStoreToDelete(null);
      })
      .catch((err) => {
        handleErrorSonner(err.response?.data?.error || t('stores.errorDeletingStore'));
      })
      .finally(() => setLoading(false));
  };

  const handleTransfer = () => {
    if (transferType === 'imei' && !transferImei) {
      return handleErrorSonner(t('stores.enterImei'));
    }
    if (transferType === 'accessory' && !transferProductId) {
      return handleErrorSonner(t('stores.selectAccessoryError'));
    }
    if (!targetStoreId) {
      return handleErrorSonner(t('stores.selectTargetStoreError'));
    }

    const selectedAcc = accessories.find(a => a.id === transferProductId);
    if (transferType === 'accessory' && selectedAcc && transferQuantity > selectedAcc.stock) {
      return handleErrorSonner(t('stores.onlyUnitsAvailable').replace('{count}', String(selectedAcc.stock)));
    }

    const config: AxiosRequestConfig = {
      url: `${API}/products/transfer`,
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      data: transferType === 'imei' 
        ? { imei: transferImei, targetStoreId }
        : { productId: transferProductId, targetStoreId, quantity: transferQuantity },
    };

    setLoading(true);
    axios(config)
      .then(() => {
        handleSuccessSonner(t('stores.productTransferred') + (transferType === 'accessory' ? ` (${transferQuantity} ${t('products.units')})` : ''));
        setTransferImei('');
        setTransferProductId('');
        setTransferQuantity(1);
        setTargetStoreId('');
        setShowTransfer(false);
        router.refresh();
      })
      .catch((err) => {
        handleErrorSonner(err.response?.data?.error || t('stores.errorTransferring'));
      })
      .finally(() => setLoading(false));
  };

  const loadAccessories = async () => {
    setLoadingAccessories(true);
    try {
      const res = await axios.get(`${API}/products?category=ACCESSORY&active=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const products = res.data.products || res.data || [];
      setAccessories(products.filter((p: any) => p.stock > 0).map((p: any) => ({
        id: p.id,
        name: p.name,
        model: p.model,
        stock: p.stock,
        storeName: p.store?.name,
      })));
    } catch (err) {
      console.error('Error loading accessories:', err);
    } finally {
      setLoadingAccessories(false);
    }
  };

  const loadStoreDetail = async (storeId: string) => {
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API}/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const store = res.data.store;
      setStoreDetail(store);
      // Preparar datos para edición
      setEditData({
        name: store.name,
        address: store.address || '',
        phone: store.phone || '',
        googleMapsUrl: store.googleMapsUrl || '',
        mondayHours: store.mondayHours,
        tuesdayHours: store.tuesdayHours,
        wednesdayHours: store.wednesdayHours,
        thursdayHours: store.thursdayHours,
        fridayHours: store.fridayHours,
        saturdayHours: store.saturdayHours,
        sundayHours: store.sundayHours,
        appointmentDuration: store.appointmentDuration || 15,
      });
      // Inicializar días habilitados
      const enabled: Record<string, boolean> = {};
      DAYS.forEach(day => {
        enabled[day.key] = !!store[day.key];
      });
      setDayEnabled(enabled);
    } catch (err) {
      console.error('Error loading store detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveConfig = () => {
    if (!selectedStore) return;

    const config: AxiosRequestConfig = {
      url: `${API}/stores/${selectedStore.id}`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      data: editData,
    };

    setLoading(true);
    axios(config)
      .then(() => {
        handleSuccessSonner(t('stores.storeUpdated'));
        setStores(prev => prev.map(s => 
          s.id === selectedStore.id ? { ...s, ...editData } : s
        ));
        setShowConfig(false);
        loadStoreDetail(selectedStore.id);
      })
      .catch((err) => {
        handleErrorSonner(err.response?.data?.error || t('stores.errorUpdating'));
      })
      .finally(() => setLoading(false));
  };

  const toggleDay = (dayKey: string, enabled: boolean) => {
    setDayEnabled(prev => ({ ...prev, [dayKey]: enabled }));
    if (!enabled) {
      setEditData(prev => ({ ...prev, [dayKey]: null }));
    } else {
      const defaultHours = dayKey === 'saturdayHours' ? '09:00-17:00' : 
                          dayKey === 'sundayHours' ? '09:00-13:00' : '09:00-19:00';
      setEditData(prev => ({ ...prev, [dayKey]: defaultHours }));
    }
  };

  const updateDayHours = (dayKey: string, type: 'open' | 'close', value: string) => {
    const current = (editData[dayKey as keyof Store] as string) || '09:00-19:00';
    const [openTime, closeTime] = current.split('-');
    const newValue = type === 'open' ? `${value}-${closeTime}` : `${openTime}-${value}`;
    setEditData(prev => ({ ...prev, [dayKey]: newValue }));
  };

  const getHours = (dayKey: string): { open: string; close: string } => {
    const value = editData[dayKey as keyof Store] as string;
    if (!value) return { open: '09:00', close: '19:00' };
    const [open, close] = value.split('-');
    return { open: open || '09:00', close: close || '19:00' };
  };

  const applyToWeekdays = () => {
    const mondayHours = editData.mondayHours;
    if (mondayHours) {
      setEditData(prev => ({
        ...prev,
        tuesdayHours: mondayHours,
        wednesdayHours: mondayHours,
        thursdayHours: mondayHours,
        fridayHours: mondayHours,
      }));
      setDayEnabled(prev => ({
        ...prev,
        tuesdayHours: true,
        wednesdayHours: true,
        thursdayHours: true,
        fridayHours: true,
      }));
    }
  };

  const iconRef: { [key: string]: LucideIcon } = {
    store: StoreIcon,
    building: BuildingIcon,
    warehouse: WarehouseIcon,
  };

  const Icon = ({ name }: { name: string }) => {
    const IconUsed = iconRef[name] || StoreIcon;
    return <IconUsed className='h-5 w-5' />;
  };

  const selectedAcc = accessories.find(a => a.id === transferProductId);

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4'>
        {stores.map((store, i) => (
          <Card
            key={i}
            className='col-span-1 hover:bg-gray-50 transition-colors cursor-pointer p-3 md:p-4'
            onClick={() => {
              setSelectedStore(store);
              loadStoreDetail(store.id);
            }}
          >
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1'>
              <div className='flex items-center gap-2'>
                <Icon name={store.icon} />
                <h2 className='font-medium text-sm md:text-base truncate'>{store.name}</h2>
              </div>
              <div className='flex items-center gap-1 text-gray-500'>
                <PackageIcon className='h-3 w-3 md:h-4 md:w-4' />
                <span className='text-xs md:text-sm'>{store.phones || 0}</span>
              </div>
            </div>
          </Card>
        ))}
        <Card className='col-span-1 justify-center items-center flex bg-zinc-200 p-0 py-3'>
          <StoreAdd handleAdd={handleAdd} loading={loading} open={open} setOpen={setOpen} />
        </Card>
      </div>

      {/* Modal de detalle de tienda */}
      <Dialog open={!!selectedStore && !showConfig} onOpenChange={() => { setSelectedStore(null); setStoreDetail(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Icon name={selectedStore?.icon || 'store'} />
              {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>{t('stores.storeInfo')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {loadingDetail ? (
              <p className='text-sm text-gray-500'>{t('common.loading')}</p>
            ) : (
              <>
                <div className='flex items-center gap-3'>
                  <SmartphoneIcon className='h-5 w-5 text-blue-500' />
                  <div className='flex-1'>
                    <p className='text-sm text-gray-500'>{t('stores.phonesInStock')}</p>
                    <span className='font-semibold'>{storeDetail?.phonesCount || 0}</span>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <HeadphonesIcon className='h-5 w-5 text-green-500' />
                  <div className='flex-1'>
                    <p className='text-sm text-gray-500'>{t('stores.accessoriesInfo')}</p>
                    <span className='font-semibold'>{storeDetail?.accessoriesItems || 0} {t('products.items')} ({storeDetail?.accessoriesStock || 0} {t('products.units')})</span>
                  </div>
                </div>

                {storeDetail?.address && (
                  <div className='flex items-center gap-3'>
                    <MapPinIcon className='h-5 w-5 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-500'>{t('stores.address')}</p>
                      <p className='font-semibold'>{storeDetail.address}</p>
                    </div>
                  </div>
                )}

                {storeDetail?.phone && (
                  <div className='flex items-center gap-3'>
                    <PhoneIcon className='h-5 w-5 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-500'>{t('stores.phone')}</p>
                      <p className='font-semibold'>{storeDetail.phone}</p>
                    </div>
                  </div>
                )}

                {storeDetail?.mondayHours && (
                  <div className='flex items-center gap-3'>
                    <ClockIcon className='h-5 w-5 text-gray-500' />
                    <div>
                      <p className='text-sm text-gray-500'>{t('stores.schedule')}</p>
                      <p className='text-sm'>{t('stores.monday').substring(0, 1)}-{t('stores.friday').substring(0, 1)}: {storeDetail.mondayHours}</p>
                      {storeDetail.saturdayHours && <p className='text-sm'>{t('stores.saturday').substring(0, 3)}: {storeDetail.saturdayHours}</p>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
            <Button variant='outline' onClick={() => setShowConfig(true)}>
              <SettingsIcon className='h-4 w-4 mr-2' />
              {t('stores.configure')}
            </Button>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => { setShowTransfer(true); setSelectedStore(null); }}>
                <ArrowRightLeftIcon className='h-4 w-4 mr-2' />
                {t('stores.transfer')}
              </Button>
              <Button
                variant='destructive'
                onClick={() => selectedStore && handleDelete(selectedStore.id, selectedStore.name)}
                disabled={loading}
              >
                <Trash2Icon className='h-4 w-4' />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('stores.configure')} {selectedStore?.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue='general'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='general'>{t('stores.general')}</TabsTrigger>
              <TabsTrigger value='horarios'>{t('stores.hours')}</TabsTrigger>
              <TabsTrigger value='turnos'>{t('stores.appointments')}</TabsTrigger>
            </TabsList>

            <TabsContent value='general' className='space-y-4 mt-4'>
              <div>
                <Label>{t('common.name')}</Label>
                <Input value={editData.name || ''} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>{t('stores.address')}</Label>
                <Input value={editData.address || ''} onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))} placeholder='Ej: Av. Mitre 1234, Adrogue' />
              </div>
              <div>
                <Label>{t('stores.phone')}</Label>
                <Input value={editData.phone || ''} onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))} placeholder='1155667788' />
              </div>
              <div>
                <Label>{t('stores.googleMapsLink')}</Label>
                <Input value={editData.googleMapsUrl || ''} onChange={(e) => setEditData(prev => ({ ...prev, googleMapsUrl: e.target.value }))} placeholder='https://maps.google.com/...' />
              </div>
            </TabsContent>

            <TabsContent value='horarios' className='space-y-3 mt-4'>
              <div className='flex justify-between items-center mb-2'>
                <p className='text-sm text-zinc-500'>{t('stores.businessHours')}</p>
                <Button variant='outline' size='sm' onClick={applyToWeekdays} className='text-xs'>
                  {t('stores.copyMondayToWeekdays')}
                </Button>
              </div>

              {DAYS.map((day) => {
                const hours = getHours(day.key);
                const isEnabled = dayEnabled[day.key];
                
                return (
                  <div key={day.key} className='flex items-center gap-3 py-2 border-b'>
                    <div className='w-24'>
                      <span className={`text-sm font-medium ${!isEnabled ? 'text-zinc-400' : ''}`}>
                        {day.label}
                      </span>
                    </div>
                    <Switch checked={isEnabled} onCheckedChange={(checked) => toggleDay(day.key, checked)} />
                    {isEnabled ? (
                      <div className='flex items-center gap-2 flex-1'>
                        <Input type='time' value={hours.open} onChange={(e) => updateDayHours(day.key, 'open', e.target.value)} className='w-28' />
                        <span className='text-zinc-400'>{t('stores.to')}</span>
                        <Input type='time' value={hours.close} onChange={(e) => updateDayHours(day.key, 'close', e.target.value)} className='w-28' />
                      </div>
                    ) : (
                      <span className='text-sm text-zinc-400'>{t('stores.closed')}</span>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value='turnos' className='space-y-4 mt-4'>
              <div>
                <Label>{t('stores.appointmentDuration')}</Label>
                <div className='flex gap-2 mt-2'>
                  {[15, 30, 45, 60].map((mins) => (
                    <Button
                      key={mins}
                      type='button'
                      variant={editData.appointmentDuration === mins ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setEditData(prev => ({ ...prev, appointmentDuration: mins }))}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
                <p className='text-xs text-zinc-500 mt-2'>
                  {t('stores.appointmentsOfferedEvery').replace('{mins}', String(editData.appointmentDuration || 15))}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className='mt-4'>
            <Button variant='outline' onClick={() => setShowConfig(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveConfig} disabled={loading}>
              {loading ? t('stores.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de traslado */}
      <Dialog open={showTransfer} onOpenChange={(open) => {
        setShowTransfer(open);
        if (!open) {
          setTransferImei('');
          setTransferProductId('');
          setTransferQuantity(1);
          setTargetStoreId('');
          setFoundProduct(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ArrowRightLeftIcon className='h-5 w-5' />
              {t('stores.transferProduct')}
            </DialogTitle>
            <DialogDescription>{t('stores.moveProductBetweenStores')}</DialogDescription>
          </DialogHeader>

          <Tabs value={transferType} onValueChange={(v) => {
            setTransferType(v as 'imei' | 'accessory');
            if (v === 'accessory' && accessories.length === 0) loadAccessories();
          }}>
            <TabsList className='w-full'>
              <TabsTrigger value='imei' className='flex-1'>{t('stores.device')}</TabsTrigger>
              <TabsTrigger value='accessory' className='flex-1'>{t('stores.accessory')}</TabsTrigger>
            </TabsList>

            <TabsContent value='imei' className='space-y-4 pt-4'>
              <div>
                <Label>{t('stores.deviceImei')}</Label>
                <Input 
                  placeholder={t('stores.enterOrScanImei')} 
                  value={transferImei} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setTransferImei(value);
                    setFoundProduct(null);
                    
                    // Buscar producto cuando el IMEI tiene al menos 10 caracteres
                    if (value.length >= 10) {
                      setSearchingImei(true);
                      axios.get(`${API}/products/imei/${value}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                      })
                        .then((res) => {
                          const product = res.data.product;
                          if (product) {
                            setFoundProduct({
                              id: product.id,
                              model: product.model || product.name,
                              color: product.color || '',
                              storage: product.storage || '',
                              battery: product.battery || 0,
                              storeName: product.store?.name || '',
                              storeId: product.store?.id || '',
                            });
                          }
                        })
                        .catch(() => {
                          setFoundProduct(null);
                        })
                        .finally(() => setSearchingImei(false));
                    }
                  }} 
                />
                {searchingImei && (
                  <p className='text-sm text-zinc-500 mt-2'>{t('common.searching')}...</p>
                )}
              </div>
              
              {foundProduct && (
                <div className='bg-zinc-50 border rounded-lg p-3 space-y-2'>
                  <p className='text-sm font-medium text-green-600'>{t('stores.productFound')}</p>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div>
                      <span className='text-zinc-500'>{t('products.model')}:</span>
                      <span className='ml-2 font-medium'>{foundProduct.model}</span>
                    </div>
                    {foundProduct.color && (
                      <div>
                        <span className='text-zinc-500'>{t('products.color')}:</span>
                        <span className='ml-2 font-medium'>{foundProduct.color}</span>
                      </div>
                    )}
                    {foundProduct.storage && (
                      <div>
                        <span className='text-zinc-500'>{t('products.storage')}:</span>
                        <span className='ml-2 font-medium'>{foundProduct.storage}</span>
                      </div>
                    )}
                    {foundProduct.battery > 0 && (
                      <div>
                        <span className='text-zinc-500'>{t('products.battery')}:</span>
                        <span className='ml-2 font-medium'>{foundProduct.battery}%</span>
                      </div>
                    )}
                    <div className='col-span-2'>
                      <span className='text-zinc-500'>{t('stores.currentStore')}:</span>
                      <span className='ml-2 font-medium text-blue-600'>{foundProduct.storeName}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {transferImei.length >= 10 && !searchingImei && !foundProduct && (
                <p className='text-sm text-red-500'>{t('stores.productNotFound')}</p>
              )}
            </TabsContent>

            <TabsContent value='accessory' className='space-y-4 pt-4'>
              <div>
                <Label>{t('stores.selectAccessory')}</Label>
                <Select value={transferProductId} onValueChange={(v) => { setTransferProductId(v); setTransferQuantity(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAccessories ? t('stores.loadingAccessories') : t('stores.selectAccessory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accessories.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} - {t('products.stock')}: {acc.stock} {acc.storeName ? `| ${acc.storeName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedAcc && (
                <div>
                  <Label>{t('stores.quantityToTransfer')}</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={1}
                      max={selectedAcc.stock}
                      value={transferQuantity || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setTransferQuantity(0);
                        } else {
                          const num = parseInt(val);
                          setTransferQuantity(Math.min(num, selectedAcc.stock));
                        }
                      }}
                      onBlur={() => {
                        if (transferQuantity < 1) setTransferQuantity(1);
                      }}
                      className='w-24'
                    />
                    <span className='text-sm text-zinc-500'>{t('stores.ofAvailable').replace('{count}', String(selectedAcc.stock))}</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className='pt-2'>
            <Label>{t('stores.targetStore')}</Label>
            <Select value={targetStoreId} onValueChange={setTargetStoreId}>
              <SelectTrigger>
                <SelectValue placeholder={t('stores.selectTargetStore')} />
              </SelectTrigger>
              <SelectContent>
                {stores
                  .filter((store) => {
                    // Si es IMEI, filtrar la tienda donde ya está el producto
                    if (transferType === 'imei' && foundProduct?.storeId) {
                      return store.id !== foundProduct.storeId;
                    }
                    // Si es accesorio, filtrar la tienda donde ya está el producto
                    if (transferType === 'accessory' && selectedAcc?.storeName) {
                      return store.name !== selectedAcc.storeName;
                    }
                    return true;
                  })
                  .map((store) => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowTransfer(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleTransfer} disabled={loading}>
              {loading ? t('stores.transferring') : transferType === 'accessory' && transferQuantity > 1 ? t('stores.transferUnits').replace('{count}', String(transferQuantity)) : t('stores.transfer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('stores.deleteConfirm').replace('{name}', storeToDelete?.name || '')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('stores.deleteWarning') || 'Esta acción no se puede deshacer. La sucursal será eliminada permanentemente del sistema.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirm(false);
              setStoreToDelete(null);
            }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
