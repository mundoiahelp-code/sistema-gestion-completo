'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';
import ErrorRequest from '@/components/common/ErrorRequest';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';

import Sale from './Sale';

interface SaleData {
  id: string;
  total: number;
  discount: number;
  paymentMethod: string;
  saleType: string;
  notes?: string;
  createdAt: string;
  client?: { id: string; name: string; phone?: string; email?: string; dni?: string };
  user?: { id: string; name: string; email?: string };
  store?: { id: string; name: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
      model?: string;
      color?: string;
      storage?: string;
      imei?: string;
      battery?: number;
    };
  }[];
}

interface Props {
  id: string;
}

export default function Single({ id }: Props) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const token = Cookies.get('accessToken');
        
        const res = await axios.get(`${API}/sales/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSale(res.data.sale);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !sale) return <ErrorRequest />;

  // Calcular subtotal de items
  const subTotal = sale.items.reduce((acc, item) => acc + item.subtotal, 0);

  // Mapear método de pago al formato del frontend
  const paymentMethodMap: Record<string, string> = {
    CASH: 'EfectiveArs',
    CASH_ARS: 'EfectiveArs',
    CASH_USD: 'EfectiveUsd',
    CARD: 'EfectiveArs',
    TRANSFER: 'TransferArs',
    TRANSFER_ARS: 'TransferArs',
    USDT_BINANCE: 'TransferUsdt',
    MIXED: 'EfectiveArs',
  };

  const saleTypeMap: Record<string, string> = {
    RETAIL: 'Retail',
    WHOLESALE: 'Wholesale',
  };

  // Adaptar al formato esperado por Sale component
  const adaptedData: any = {
    id: sale.id,
    code: sale.id.slice(-6).toUpperCase(),
    type: saleTypeMap[sale.saleType] || 'Retail',
    totalAmount: sale.total,
    cancelled: false,
    notes: sale.notes || '',
    createdAt: new Date(sale.createdAt),
    updatedAt: new Date(sale.createdAt),
    amounts: {
      subTotal: subTotal || sale.total,
      discount: sale.discount || 0,
      total: sale.total,
    },
    client: {
      id: sale.client?.id || '',
      name: sale.client?.name || (isSpanish ? 'Sin cliente' : 'No client'),
      dni: sale.client?.dni || '-',
      phone: sale.client?.phone || '-',
      email: sale.client?.email || '-',
      page: '-',
      zone: '-',
    },
    vendor: {
      id: sale.user?.id || '',
      name: sale.user?.name || (isSpanish ? 'Sin vendedor' : 'No seller'),
      email: sale.user?.email || '-',
    },
    payment: [
      {
        type: paymentMethodMap[sale.paymentMethod] || 'EfectiveArs',
        amount: sale.total,
      },
    ],
    phoneAsPayment: false,
    paymentPhone: [],
    items: sale.items.map((item) => ({
      id: item.product.id,
      imei: item.product.imei || '-',
      model: item.product.model || item.product.name,
      color: item.product.color || '-',
      storage: item.product.storage || '-',
      battery: item.product.battery || 0,
      price: item.price,
    })),
  };

  return <Sale data={adaptedData} />;
}
