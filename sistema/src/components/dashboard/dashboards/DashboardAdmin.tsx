import {
  ShoppingBagIcon,
  SmartphoneIcon,
  PackageIcon,
  TagIcon,
} from 'lucide-react';

import Cards from '../items/Cards';
import LastOrders from '../items/LastOrders';
import { IDashboard } from '@/interfaces/dashboard.interface';
import LastSales from '../items/LastSales';
import Stats from '../items/Stats';
import DolarBlue from '../items/DolarBlue';
import SalesGraph from '../items/SalesGraph';
import Lists from '../items/Lists';
import Stores from '../items/Stores';
import TodayAppointments from '../items/TodayAppointments';
import { useTranslation } from '@/i18n/I18nProvider';
import { getFeaturesForLocale } from '@/lib/features';

interface Props {
  data: IDashboard;
}

export default function DashboardAdmin({ data }: Props) {
  const { t, locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  const { catalogue, sales } = data;

  const { lastOrders, totalReserved, phonesStock, accessoriesStock, capitalIphones, capitalAccessories } = catalogue;
  const { totalSales, lastSales, salesByMonth, earningsUSD, earningsARS } = sales;

  const card_data = [
    {
      title: t('dashboard.totalPhones'),
      icon: SmartphoneIcon,
      value: phonesStock || 0,
      color: 'blue',
    },
    {
      title: t('dashboard.totalAccessories'),
      icon: PackageIcon,
      value: accessoriesStock || 0,
      color: 'green',
    },
    {
      title: t('dashboard.totalSales'),
      icon: TagIcon,
      value: totalSales,
      color: 'yellow',
    },
    {
      title: t('dashboard.totalReserved'),
      icon: ShoppingBagIcon,
      value: totalReserved,
      color: 'orange',
    },
  ];

  // Show appointments only if locale is Spanish (has appointments feature)
  const showAppointments = localeFeatures.appointments;
  // Show DolarBlue only for Spanish locale (Argentina)
  const showDolarBlue = localeFeatures.dolarBlue;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-x-6 lg:gap-y-4'>
      {/* Stats en móvil primero */}
      <div className='lg:hidden col-span-1 space-y-4'>
        <Stats 
          capitalIphones={capitalIphones} 
          capitalAccessories={capitalAccessories}
          earningsUSD={earningsUSD}
          earningsARS={earningsARS}
        />
      </div>
      
      {/* LEFT - Contenido principal */}
      <div className='col-span-1 lg:col-span-4 flex flex-col gap-3'>
        <Cards data={card_data} />
        
        {/* Turnos de hoy - solo si locale es español */}
        {showAppointments && <TodayAppointments />}
        
        <SalesGraph data={salesByMonth} />
        <LastSales data={lastSales} />
        <LastOrders data={lastOrders} />
      </div>

      {/* RIGHT - Sidebar (oculto en móvil, Stats ya se muestra arriba) */}
      <div className='hidden lg:flex lg:col-span-1 flex-col gap-4'>
        <Stats 
          capitalIphones={capitalIphones} 
          capitalAccessories={capitalAccessories}
          earningsUSD={earningsUSD}
          earningsARS={earningsARS}
        />
        <Lists />
        <Stores />
        {showDolarBlue && <DolarBlue />}
      </div>
      
      {/* En móvil, mostrar el resto del sidebar abajo */}
      <div className='lg:hidden col-span-1 flex flex-col gap-4'>
        <Lists />
        <Stores />
        {showDolarBlue && <DolarBlue />}
      </div>
    </div>
  );
}
