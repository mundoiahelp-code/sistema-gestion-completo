'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Payment } from '@/enums/payment.enum';
import { Role } from '@/enums/role.enum';
import { IClient, IPhone } from '@/interfaces/schemas.interfaces';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import AccessorySearch from './AccessorySearch';
import AddManually from './AddManually';
import PhoneAsPayment from './PhoneAsPayment';
import Scan from './Scan';
import TableProducts from './TableProducts';
import DollarConverter from './DollarConverter';
import { Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/I18nProvider';

type InputType = {
  type: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
};

interface IPhonePayment {
  model: string;
  color: string;
  storage: string;
  battery: string;
  price: number;
}

interface Props {
  items: IPhone[];
  loading: boolean;
  handleAddItem: (imei: string) => void;
  handleAddAccessory: (accessory: any, quantity: number) => void;
  handleRemoveItem: (id: string) => void;
  client: IClient | null;
  amount: InputType;
  notes: InputType;
  resume: {
    subTotal: number;
    discount: number;
    totalAmount: number;
    totalCost: number;
    profit: number;
    totalUSD: number;
    totalARS: number;
  };
  payment: { type: Payment; amount: string }[];
  setPayment: React.Dispatch<
    React.SetStateAction<{ type: Payment; amount: string }[]>
  >;
  handleConfirmSale: () => void;
  phonePayment: IPhonePayment[];
  setPhonePayment: React.Dispatch<React.SetStateAction<IPhonePayment[]>>;
  saleType: 'RETAIL' | 'WHOLESALE';
  setSaleType: React.Dispatch<React.SetStateAction<'RETAIL' | 'WHOLESALE'>>;
  wholesaleClientName: InputType;
}

const paymentMethods = [
  { name: 'Cash (Local)', nameEs: 'Efectivo ARS', value: Payment.EFECTIVE_ARS },
  { name: 'Cash (USD)', nameEs: 'Efectivo USD', value: Payment.EFECTIVE_USD },
  { name: 'Bank Transfer', nameEs: 'Transferencia', value: Payment.TRANSFER_ARS },
  { name: 'USDT', nameEs: 'USDT', value: Payment.TRANSFER_USDT },
];

export default function Sale({
  items,
  loading,
  handleAddItem,
  handleAddAccessory,
  handleRemoveItem,
  amount,
  notes,
  resume,
  payment,
  setPayment,
  handleConfirmSale,
  phonePayment,
  setPhonePayment,
  saleType,
  setSaleType,
  wholesaleClientName,
}: Props) {
  const { role } = useGetUserInfo();
  const { t, locale } = useTranslation();
  const isAdmin = role === Role.Admin;

  const getPaymentMethodName = (method: typeof paymentMethods[0]) => {
    return locale === 'es' ? method.nameEs : method.name;
  };

  // Listener para scanner IMEI
  useEffect(() => {
    const handleImeiScanned = (e: CustomEvent) => {
      const { imei, product } = e.detail;
      if (imei && product?.productId) {
        handleAddItem(imei);
      }
    };
    
    window.addEventListener('imei-scanned-venta', handleImeiScanned as EventListener);
    return () => window.removeEventListener('imei-scanned-venta', handleImeiScanned as EventListener);
  }, [handleAddItem]);

  const handleAddPayment = () => {
    setPayment([...payment, { type: '' as Payment, amount: '0' }]);
  };

  const handleRemovePayment = (index: number) => {
    if (payment.length > 1) {
      setPayment(payment.filter((_, i) => i !== index));
    }
  };

  const handlePaymentTypeChange = (index: number, value: Payment) => {
    const updated = [...payment];
    updated[index].type = value;
    setPayment(updated);
  };

  const handlePaymentAmountChange = (index: number, value: string) => {
    const re = /^[0-9\b]*$/;
    if (value === '' || re.test(value)) {
      const updated = [...payment];
      updated[index].amount = value;
      setPayment(updated);
    }
  };

  // Calcular pagos por moneda
  const paidUSD = payment
    .filter((p) => p.type === Payment.EFECTIVE_USD || p.type === Payment.TRANSFER_USDT)
    .reduce((acc, p) => acc + (+p.amount || 0), 0);
  
  const paidARS = payment
    .filter((p) => p.type === Payment.EFECTIVE_ARS || p.type === Payment.TRANSFER_ARS)
    .reduce((acc, p) => acc + (+p.amount || 0), 0);

  const totalPhonePayment = phonePayment.reduce((acc, p) => acc + p.price, 0);
  
  // Calcular lo que falta por moneda
  const remainingUSD = resume.totalUSD - paidUSD;
  const remainingARS = resume.totalARS - paidARS - totalPhonePayment;

  // Detectar si hay pagos en ARS y productos en USD
  const hasARSPayment = payment.some(p => p.type === Payment.EFECTIVE_ARS || p.type === Payment.TRANSFER_ARS);
  const hasUSDProducts = resume.totalUSD > 0;
  const showConverter = hasARSPayment && hasUSDProducts && locale === 'es'; // Solo mostrar en español
  
  // Detectar si el pago ARS es transferencia
  const isTransferPayment = payment.some(p => p.type === Payment.TRANSFER_ARS);

  // Handler para aplicar conversión automática
  const handleDollarConversion = (amountARS: number) => {
    // Buscar el índice del primer pago en ARS
    const arsPaymentIndex = payment.findIndex(p => 
      p.type === Payment.EFECTIVE_ARS || p.type === Payment.TRANSFER_ARS
    );
    
    if (arsPaymentIndex !== -1) {
      const updated = [...payment];
      updated[arsPaymentIndex].amount = amountARS.toString();
      setPayment(updated);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Columna izquierda - Productos */}
      <div className="space-y-3 lg:space-y-4">
        {/* Tipo de venta */}
        <Card className="p-3 lg:p-4">
          <h3 className="font-medium mb-2 lg:mb-3 text-sm lg:text-base">{t('sales.saleType')}</h3>
          <div className="flex gap-2">
            <Button
              variant={saleType === 'RETAIL' ? 'default' : 'outline'}
              onClick={() => setSaleType('RETAIL')}
              className="flex-1 text-xs lg:text-sm h-9 lg:h-10"
            >
              {locale === 'es' ? 'Minorista' : 'Retail'}
            </Button>
            <Button
              variant={saleType === 'WHOLESALE' ? 'default' : 'outline'}
              onClick={() => setSaleType('WHOLESALE')}
              className="flex-1 text-xs lg:text-sm h-9 lg:h-10"
            >
              {locale === 'es' ? 'Mayorista' : 'Wholesale'}
            </Button>
          </div>
          {saleType === 'WHOLESALE' && (
            <div className="mt-3 pt-3 border-t">
              <Label className="grid gap-2">
                <span className="text-xs lg:text-sm font-medium">{t('sales.wholesaleClient')} *</span>
                <Input
                  value={wholesaleClientName.value}
                  onChange={wholesaleClientName.onChange}
                  placeholder={locale === 'es' ? 'Ej: Distribuidora XYZ' : 'Ex: XYZ Distributors'}
                  className="text-sm h-9"
                />
              </Label>
            </div>
          )}
        </Card>

        <Card className="p-3 lg:p-4">
          <h3 className="font-medium mb-2 lg:mb-3 text-sm lg:text-base">{t('nav.products')}</h3>
          <Tabs defaultValue="phones" className="w-full">
            <TabsList className="mb-3 w-full lg:w-auto">
              <TabsTrigger value="phones" className="flex-1 lg:flex-none text-xs lg:text-sm">iPhones</TabsTrigger>
              <TabsTrigger value="accessories" className="flex-1 lg:flex-none text-xs lg:text-sm">{t('nav.accessories')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="phones">
              <Scan handleAddItem={handleAddItem} loading={loading} />
              <div className="flex gap-2 items-center mb-3">
                <AddManually handleAddItem={handleAddItem} loading={loading} />
              </div>
            </TabsContent>
            
            <TabsContent value="accessories">
              <AccessorySearch onAddAccessory={handleAddAccessory} loading={loading} />
            </TabsContent>
          </Tabs>
          
          {items.length > 0 && (
            <div className="mt-3 lg:mt-4">
              <TableProducts 
                items={items} 
                onRemove={handleRemoveItem} 
              />
            </div>
          )}
        </Card>

        {/* Monto de venta */}
        <Card className="p-3 lg:p-4">
          <Label className="grid gap-2">
            <span className="font-medium text-sm lg:text-base">{t('sales.salePrice')}</span>
            <div className="relative">
              <span className="absolute text-base lg:text-lg top-2 left-3 text-gray-500">$</span>
              <Input
                value={amount.value}
                onChange={amount.onChange}
                placeholder="0"
                className="pl-7 lg:pl-8 text-base lg:text-lg font-medium h-10 lg:h-11"
              />
            </div>
          </Label>
        </Card>

        {/* Notas */}
        <Card className="p-3 lg:p-4">
          <Label className="grid gap-2">
            <span className="font-medium text-sm lg:text-base">{t('sales.notesOptional')}</span>
            <Textarea
              value={notes.value}
              onChange={(e) => notes.onChange(e.target.value)}
              placeholder={t('sales.observations')}
              className="resize-none text-sm"
              rows={2}
            />
          </Label>
        </Card>
      </div>

      {/* Columna derecha - Pagos y Resumen */}
      <div className="space-y-3 lg:space-y-4">
        {/* Métodos de pago */}
        <Card className="p-3 lg:p-4">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h3 className="font-medium text-sm lg:text-base">{t('sales.paymentMethodsTitle')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPayment}
              className="h-7 lg:h-8 text-xs lg:text-sm"
            >
              <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" /> {t('common.add')}
            </Button>
          </div>
          
          <div className="space-y-2 lg:space-y-3">
            {payment.map((p, index) => (
              <div key={index} className="flex items-center gap-1.5 lg:gap-2">
                <Select
                  value={p.type}
                  onValueChange={(value: Payment) => handlePaymentTypeChange(index, value)}
                >
                  <SelectTrigger className="flex-1 h-9 text-xs lg:text-sm">
                    <SelectValue placeholder={t('sales.method')} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value} className="text-sm">
                        {getPaymentMethodName(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="absolute text-xs lg:text-sm top-2.5 left-2 text-gray-500">$</span>
                  <Input
                    value={p.amount}
                    onChange={(e) => handlePaymentAmountChange(index, e.target.value)}
                    placeholder="0"
                    className="pl-5 lg:pl-6 h-9 text-sm"
                  />
                </div>
                {payment.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePayment(index)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Conversor de dólares (solo si hay pago en ARS y productos en USD) */}
        {showConverter && (
          <DollarConverter 
            totalUSD={resume.totalUSD}
            onConvert={handleDollarConversion}
            isTransfer={isTransferPayment}
          />
        )}

        {/* Celular como pago */}
        <Card className="p-3 lg:p-4">
          <PhoneAsPayment items={phonePayment} setItems={setPhonePayment} />
        </Card>

        {/* Resumen */}
        <Card className="p-3 lg:p-4 bg-gray-50 dark:bg-zinc-800">
          <h3 className="font-medium mb-2 lg:mb-3 text-sm lg:text-base dark:text-zinc-100">{t('sales.summary')}</h3>
          <div className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm">
            {/* Totales por moneda */}
            {resume.totalUSD > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400">{t('sales.totalUSD')}:</span>
                <span className="font-medium text-green-600">USD ${resume.totalUSD.toLocaleString()}</span>
              </div>
            )}
            {resume.totalARS > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400">{t('sales.totalLocal')}:</span>
                <span className="font-medium">{locale === 'es' ? 'ARS' : 'Local'} ${resume.totalARS.toLocaleString()}</span>
              </div>
            )}
            
            {/* Pagado por moneda */}
            {paidUSD > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t('sales.paidUSD')}:</span>
                <span>USD ${paidUSD.toLocaleString()}</span>
              </div>
            )}
            {paidARS > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t('sales.paidLocal')}:</span>
                <span>{locale === 'es' ? 'ARS' : 'Local'} ${paidARS.toLocaleString()}</span>
              </div>
            )}
            
            {totalPhonePayment > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>{t('sales.phonePartPayment')}:</span>
                <span>-{locale === 'es' ? 'ARS' : 'Local'} ${totalPhonePayment.toLocaleString()}</span>
              </div>
            )}
            
            {/* Falta por moneda */}
            <div className="border-t pt-2 mt-2">
              {resume.totalUSD > 0 && (
                <div className={`flex justify-between font-medium ${remainingUSD > 0 ? 'text-red-600' : remainingUSD < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  <span>{remainingUSD > 0 ? 'Falta USD:' : remainingUSD < 0 ? 'Vuelto USD:' : 'USD:'}</span>
                  <span>{remainingUSD === 0 ? '✓ Pagado' : `USD $${Math.abs(remainingUSD).toLocaleString()}`}</span>
                </div>
              )}
              {resume.totalARS > 0 && (
                <div className={`flex justify-between font-medium ${remainingARS > 0 ? 'text-red-600' : remainingARS < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  <span>{remainingARS > 0 ? 'Falta ARS:' : remainingARS < 0 ? 'Vuelto ARS:' : 'ARS:'}</span>
                  <span>{remainingARS === 0 ? '✓ Pagado' : `ARS $${Math.abs(remainingARS).toLocaleString()}`}</span>
                </div>
              )}
            </div>
            
            {isAdmin && resume.totalCost > 0 && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-gray-500">
                  <span>{t('products.cost')}:</span>
                  <span>${resume.totalCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Botón confirmar */}
        <Button
          onClick={handleConfirmSale}
          disabled={loading || items.length === 0 || !amount.value}
          className="w-full h-10 lg:h-12 text-sm lg:text-lg"
        >
          {loading ? t('sales.processing') : t('sales.confirmSale')}
        </Button>
      </div>
    </div>
  );
}
