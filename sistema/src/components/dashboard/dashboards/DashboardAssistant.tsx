import { SmartphoneIcon } from 'lucide-react';

import Cards from '../items/Cards';
import { IDashboard } from '@/interfaces/dashboard.interface';

interface Props {
  data: IDashboard;
}
export default function DashboardAssistant({ data }: Props) {
  const { catalogue } = data;
  const { phones } = catalogue;

  const card_data = [
    {
      title: 'Celulares',
      icon: SmartphoneIcon,
      value: phones,
      color: 'blue',
    },
  ];

  return (
    <div className='grid grid-cols-5 gap-x-6 gap-y-4'>
      {/* LEFT */}
      <div className='col-span-5 lg:col-span-4 flex flex-col gap-3'>
        <Cards data={card_data} />
      </div>
    </div>
  );
}
