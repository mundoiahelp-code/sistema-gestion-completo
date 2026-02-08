'use client';

import { LoaderIcon } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

import LoadingPage from '@/components/layout/LoadingPage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderContext } from '@/context/order/order.context';
import { OrderTypes } from '@/context/order/order.types';
import useOrder from '@/hooks/useOrder';
import useSelectIPhone from '@/hooks/useSelectIPhone';
import useSonner from '@/hooks/useSonner';
import { useTranslation } from '@/i18n/I18nProvider';
import AddManually from './AddManually';
import Scan from './Scan';
import TableProducts from './TableProducts';
import useStores from '@/hooks/useStores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toTitleCase } from '@/helpers/toTitleCase';
import AddAccessoryForm from './AddAccessoryForm';
import { API } from '@/config/api';
import ImeiOCRScanner from '@/components/common/ImeiOCRScanner';

export default function AddOrder() {
  const { state, dispatch } = useContext(OrderContext);
  const { phones } = state;
  const [activeTab, setActiveTab] = useState('phones');
  const [lookingUp, setLookingUp] = useState(false);
  const { t, locale } = useTranslation();

  const { models, iphonesLS } = useSelectIPhone();
  const { stores, loadingStores } = useStores();

  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const { vendor, notes, store, handleAddOrder, loading } = useOrder();

  // Listener para scanner IMEI
  useEffect(() => {
    const handleImeiScanned = (e: CustomEvent) => {
      const { imei } = e.detail;
      if (imei) {
        handleAddImei(imei);
      }
    };
    
    window.addEventListener('imei-scanned-ingreso', handleImeiScanned as EventListener);
    return () => window.removeEventListener('imei-scanned-ingreso', handleImeiScanned as EventListener);
  }, []);

  const handleAddImei = async (imei: string) => {
    if (state.phones.find((x) => x.imei === imei)) {
      return handleErrorSonner(locale === 'es' ? 'El IMEI ya esta agregado!' : 'IMEI already added!');
    }

    // Agregar IMEI directamente sin búsqueda
    dispatch({ type: OrderTypes.PRODUCT_ADD, payload: { imei } });
    handleSuccessSonner(locale === 'es' ? 'IMEI agregado' : 'IMEI added');
  };

  if (!models || loadingStores) return <LoadingPage />;

  return (
    <Card>
      <CardHeader className="font-light text-lg md:text-xl pb-2">
        {locale === 'es' ? 'Nuevo ingreso' : 'New Entry'}
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4 w-full md:w-auto">
            <TabsTrigger value="phones" className="flex-1 md:flex-none">iPhones</TabsTrigger>
            <TabsTrigger value="accessories" className="flex-1 md:flex-none">{t('nav.accessories')}</TabsTrigger>
          </TabsList>

          <TabsContent value="phones">
            <Scan addOne={handleAddImei} />
            <AddManually addOne={handleAddImei} />
            {phones.length > 0 && (
              <>
                <TableProducts data={phones} models={models} iphonesLS={iphonesLS} />
                <div className="mt-6 md:mt-8 w-full md:w-1/3 flex flex-col gap-3 md:gap-4">
                  <Label>
                    <span className="text-zinc-600 text-sm">{t('common.notes')}</span>
                    <Textarea
                      placeholder={locale === 'es' ? 'Escribí aqui' : 'Write here'}
                      className="placeholder:text-gray-400 font-light text-sm"
                      value={notes.value}
                      onChange={(e) => notes.onChange(e.target.value)}
                    />
                  </Label>
                  <Label>
                    <span className="text-zinc-600 text-sm">{locale === 'es' ? 'Vendedor' : 'Seller'}</span>
                    <Input
                      {...vendor}
                      placeholder={locale === 'es' ? 'Nombre del vendedor' : 'Seller name'}
                      className="placeholder:text-slate-400 font-light text-sm"
                    />
                  </Label>
                  <Label>
                    <span className="text-zinc-600 text-sm">{t('products.store')}</span>
                    <Select
                      value={store.value}
                      onValueChange={store.onChange}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((s, i) => (
                          <SelectItem value={s.id} key={i}>
                            {toTitleCase(s.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Label>
                </div>
              </>
            )}
            {phones.length > 0 && (
              <div className="border-t py-3 mt-3">
                <Button onClick={handleAddOrder} disabled={loading} className="w-full md:w-auto">
                  {loading ? (
                    <LoaderIcon className="h-4 w-4 animate-pulse" />
                  ) : (
                    locale === 'es' ? 'Confirmar ingreso' : 'Confirm entry'
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accessories">
            <AddAccessoryForm stores={stores} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
