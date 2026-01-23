import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  ShoppingBagIcon,
  SmartphoneIcon,
  PackageIcon,
  TagIcon,
} from 'lucide-react';

import { IDashboard } from '@/interfaces/dashboard.interface';
import { API } from '@/config/api';
import Cards from '../items/Cards';
import LastOrders from '../items/LastOrders';
import LastSales from '../items/LastSales';
import SalesGraph from '../items/SalesGraph';
import Lists from '../items/Lists';
import Stores from '../items/Stores';
import TodayAppointments from '../items/TodayAppointments';
import DolarBlue from '../items/DolarBlue';
import { useTranslation } from '@/i18n/I18nProvider';
import { getFeaturesForLocale } from '@/lib/features';

interface Props {
  data: IDashboard;
}

export default function DashboardVendor({ data }: Props) {
  const { locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  const { catalogue, sales } = data;
  const { lastOrders, phones, totalReserved } = catalogue;
  const { lastSales, totalSales, salesByMonth } = sales;
  const [accessoriesCount, setAccessoriesCount] = useState(0);

  // Show appointments only if locale is Spanish (has appointments feature)
  const showAppointments = localeFeatures.appointments;
  const showDolarBlue = localeFeatures.dolarBlue;

  useEffect(() => {
    const token = Cookies.get('accessToken');
    axios
      .get(`${API}/products?category=ACCESSORY`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const products = res.data.products || res.data || [];
        // Sumar el stock de todos los accesorios
        const totalStock = products.reduce(
          (sum: number, p: any) => sum + (p.stock || 1),
          0
        );
        setAccessoriesCount(totalStock);
      })
      .catch((err) => console.error('Error loading accessories:', err));
  }, []);

  const card_data = [
    {
      title: 'Celulares',
      icon: SmartphoneIcon,
      value: phones,
      color: 'blue',
    },
    {
      title: 'Accesorios',
      icon: PackageIcon,
      value: accessoriesCount,
      color: 'green',
    },
    {
      title: 'Ventas',
      icon: TagIcon,
      value: totalSales,
      color: 'yellow',
    },
    {
      title: 'Reservas',
      icon: ShoppingBagIcon,
      value: totalReserved,
      color: 'orange',
    },
  ];

  return (
    <>
      <div className='grid grid-cols-5 gap-x-6 gap-y-4'>
        {/* LEFT */}
        <div className='col-span-5 lg:col-span-4 flex flex-col gap-3'>
          <Cards data={card_data} />
          
          {/* Turnos de hoy - solo si locale es español */}
          {showAppointments && <TodayAppointments />}
          
          <SalesGraph data={salesByMonth} />
          <LastSales data={lastSales} />
          <LastOrders data={lastOrders} />
        </div>

        {/* RIGTH */}
        <div className='md:col-span-1 col-span-5 flex flex-col gap-4'>
          <Lists />
          <Stores />
          {showDolarBlue && <DolarBlue />}
        </div>
      </div>
    </>
  );
}
