import {
  ShoppingBagIcon,
  SmartphoneIcon,
  SquareUserIcon,
  TagIcon,
} from 'lucide-react';

import { IDashboard } from '@/interfaces/dashboard.interface';
import Cards from '../items/Cards';
import LastOrders from '../items/LastOrders';
import LastSales from '../items/LastSales';
import SalesGraph from '../items/SalesGraph';
import Stats from '../items/Stats';
import Lists from '../items/Lists';
import Stores from '../items/Stores';
import CheckPhone from '../items/CheckPhone';

interface Props {
  data: IDashboard;
}

export default function DashboardDev({ data }: Props) {
  const { catalogue, sales } = data;

  const { lastOrders, phones, totalAmount, totalReserved } = catalogue;
  const { clients, totalSales, lastSales, salesByMonth, amountMonth } = sales;

  const card_data = [
    {
      title: 'Celulares',
      icon: SmartphoneIcon,
      value: phones,
      color: 'blue',
    },
    {
      title: 'Clientes',
      icon: SquareUserIcon,
      value: clients,
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
    <div className='grid grid-cols-5 gap-x-6 gap-y-4'>
      {/* LEFT */}
      <div className='col-span-5 lg:col-span-4 flex flex-col gap-3'>
        <Cards data={card_data} />
        <SalesGraph data={salesByMonth} />
        <LastSales data={lastSales} />
        <LastOrders data={lastOrders} />
      </div>

      {/* RIGTH */}
      <div className='md:col-span-1 col-span-5 flex flex-col gap-4'>
        <Stats amountMonth={amountMonth} totalAmount={totalAmount} />
        <Lists />
        <Stores />
        <CheckPhone />
      </div>
    </div>
  );
}
