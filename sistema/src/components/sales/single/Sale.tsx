'use client';

import { useEffect, useState } from 'react';
import {
  BadgeDollarSignIcon,
  ClipboardPenIcon,
  CreditCardIcon,
  LoaderCircleIcon,
  LucideIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  SquareUserIcon,
  TagIcon,
} from 'lucide-react';

import { formatDate } from '@/helpers/formatDate';
import { ISale } from '@/interfaces/schemas.interfaces';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import useCookie from '@/hooks/useCookie';
import useSonner from '@/hooks/useSonner';
import axios, { AxiosRequestConfig } from 'axios';
import { API } from '@/config/api';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  data: ISale;
}

type List = { name: string; value: string }[];

const Card = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) => {
  return (
    <div className='bg-white dark:bg-zinc-900 rounded-lg'>
      <div className='flex items-center gap-2 border-b dark:border-zinc-800 py-2 px-3'>
        <Icon className='h-5 w-5' /> {title}
      </div>
      <div>{children}</div>
    </div>
  );
};

const List = ({ items }: { items: List }) => {
  return (
    <ul className='p-1'>
      {items.map((item, i) => (
        <li className='px-2 py-1 text-sm' key={i}>
          <span className='text-gray-500'>{item.name}:</span>
          <span className='pl-2'>{item.value ? item.value : '-'}</span>
        </li>
      ))}
    </ul>
  );
};

// Componente para el botón de PDF que se carga solo en cliente
function PDFButton({ data }: { data: ISale }) {
  const { t } = useTranslation();
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null);
  const [Resume, setResume] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    Promise.all([
      import('@react-pdf/renderer'),
      import('./Resume'),
    ]).then(([pdfModule, resumeModule]) => {
      setPDFDownloadLink(() => pdfModule.PDFDownloadLink);
      setResume(() => resumeModule.default);
    });
  }, []);

  if (!isClient || !PDFDownloadLink || !Resume) {
    return <Button disabled>{t('sale.loadingPdf')}</Button>;
  }

  return (
    <PDFDownloadLink
      className='h-9 px-4 py-2 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors'
      document={<Resume data={data} />}
      fileName={`${data.client?.dni || 'sale'}-${data.code}.pdf`}
    >
      {t('sale.receipt')}
    </PDFDownloadLink>
  );
}

export default function Sale({ data }: Props) {
  const { t, locale } = useTranslation();
  const [accessToken] = useCookie('accessToken', false);
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [loading, setLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(data.cancelled);
  const router = useRouter();

  const paymentSale: { [key: string]: string } = {
    EfectiveArs: t('sale.cashArs'),
    EfectiveUsd: t('sale.cashUsd'),
    EfectiveEuros: t('sale.cashEuros'),
    TransferArs: t('sale.transferArs'),
    TransferUsdt: t('sale.transferUsdt'),
  };

  const typeSale: { [key: string]: string } = {
    Wholesale: t('sale.wholesale'),
    Retail: t('sale.retail'),
  };

  const addDays = (actual: Date, days: number) => {
    const date = new Date(actual);
    date.setDate(date.getDate() + days);
    return date;
  };

  const paymentItems: List = [
    { name: t('sale.code'), value: data.code },
    { name: t('sale.type'), value: typeSale[data.type] },
    { name: t('sale.amount'), value: `${data.totalAmount}` },
    { name: t('sale.date'), value: formatDate(data.createdAt, locale, { day: 'numeric', month: 'long', year: 'numeric' }) },
    { name: t('sale.warrantyUntil'), value: formatDate(addDays(data.createdAt, 30), locale, { day: 'numeric', month: 'long', year: 'numeric' }) },
  ];

  const getDifference = (total: number, discount: number) => ((discount / total) * 100).toFixed(2);

  const amountItems: List = [
    { name: t('sale.subtotal'), value: `${data.amounts.subTotal}` },
    { name: t('sale.discountAmount'), value: `- ${data.amounts.discount}` },
    { name: t('sale.discountPercent'), value: `${getDifference(data.amounts.subTotal, data.amounts.discount)}%` },
    { name: t('sale.total'), value: `${data.amounts.total}` },
  ];

  const clientItems: List = [
    { name: t('sale.name'), value: data.client.name },
    { name: t('sale.idNumber'), value: data.client.dni },
    { name: t('sale.page'), value: data.client.page },
    { name: t('sale.zone'), value: data.client.zone },
    { name: t('sale.email'), value: data.client.email },
    { name: t('sale.phone'), value: data.client.phone },
  ];

  const vendorItems: List = [
    { name: t('sale.name'), value: data.vendor.name },
    { name: t('sale.email'), value: data.vendor.email },
  ];

  const paymentsItems: List = data.payment.map((x) => ({
    name: paymentSale[x.type],
    value: `${x.amount}`,
  }));

  const handleCancelSale = () => {
    const config: AxiosRequestConfig = {
      url: `${API}/sales/${data.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    setLoading(true);
    axios(config)
      .then(() => {
        handleSuccessSonner(t('sale.saleCancelledSuccess'));
        setIsCancelled(true);
        router.refresh();
      })
      .catch((err) => {
        console.log(err);
        handleErrorSonner(t('sale.serverError'));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div className='grid gap-3 grid-cols-1 lg:grid-cols-3'>
        <div>
          <div className='grid gap-3'>
            {!isCancelled ? (
              <PDFButton data={data} />
            ) : (
              <p className='bg-red-100 py-1 text-center rounded-lg text-sm text-red-900 opacity-60'>
                {t('sale.saleCancelled')}
              </p>
            )}
            <div>
              <Card title={t('sale.sale')} Icon={TagIcon}>
                <List items={paymentItems} />
              </Card>
            </div>
            <div>
              <Card title={t('sale.paymentMethods')} Icon={CreditCardIcon}>
                <List items={paymentsItems} />
              </Card>
            </div>
            <div>
              <Card title={t('sale.client')} Icon={SquareUserIcon}>
                <List items={clientItems} />
              </Card>
            </div>
          </div>
        </div>

        <div>
          <div className='grid gap-3'>
            <div>
              <Card title={t('sale.amounts')} Icon={BadgeDollarSignIcon}>
                <List items={amountItems} />
              </Card>
            </div>
            {data.phoneAsPayment && (
              <div>
                <Card title={t('sale.phoneAsPayment')} Icon={SmartphoneIcon}>
                  <ul className='p-1'>
                    {data.paymentPhone.map((item, i) => (
                      <li className='text-sm px-2 py-1 flex justify-between items-center' key={i}>
                        <span>{item.model} {item.color} {item.storage} {item.battery}%</span>
                        <span>${item.price}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
            <div>
              <Card title={t('sale.notes')} Icon={ClipboardPenIcon}>
                <p className='p-2 text-gray-700 dark:text-gray-300 text-sm'>
                  {data.notes ? data.notes : '-'}
                </p>
              </Card>
            </div>
            <div>
              <Card title={t('sale.seller')} Icon={ClipboardPenIcon}>
                <List items={vendorItems} />
              </Card>
            </div>
          </div>
        </div>

        <div>
          <div>
            <Card title={t('sale.products')} Icon={ShoppingCartIcon}>
              <ul className='p-2 divide-y divide-gray-200'>
                {data.items.map((item, i) => (
                  <li className='grid grid-cols-5 items-center py-1' key={i}>
                    <div className='col-span-4'>
                      <p className='text-sm'>{item.model} {item.color} {item.storage} {item.battery}%</p>
                      <p className='text-sm text-gray-500'>{item.imei}</p>
                    </div>
                    <p className='text-green-700 font-semibold'>${item.price}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
      {!isCancelled && (
        <div className='grid gap-3 mt-3 grid-cols-1 lg:grid-cols-3'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={loading} className='bg-red-900 hover:bg-red-900 hover:opacity-90 h-0 py-4'>
                {loading ? <LoaderCircleIcon className='animate-spin' /> : t('sale.cancelSale')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sale.areYouSure')}</AlertDialogTitle>
                <AlertDialogDescription>{t('sale.cancelSaleDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('sale.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelSale}>{t('sale.continue')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
