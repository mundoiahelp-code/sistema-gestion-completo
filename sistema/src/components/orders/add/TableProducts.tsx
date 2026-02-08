'use client';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IPhone } from '@/interfaces/phone.interface';
import TableProductRow from './TableProductRow';
import MobileProductCard from './MobileProductCard';
import { useTranslation } from '@/i18n/I18nProvider';

interface IPhoneData {
  model: string;
  colors: string[];
  storages: string[];
}

interface Props {
  data: IPhone[];
  models: { [key: string]: string[] };
  iphonesLS?: IPhoneData[];
}

export default function TableProducts({ data, models, iphonesLS = [] }: Props) {
  const { locale } = useTranslation();
  const isEnglish = locale === 'en';

  return (
    <>
      {/* Vista Mobile - Tarjetas */}
      <div className="md:hidden space-y-3 my-2">
        {data.map((iphone, i) => (
          <MobileProductCard
            phone={iphone}
            index={i}
            key={i}
            models={models}
            iphonesLS={iphonesLS}
          />
        ))}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block overflow-x-auto rounded-md border my-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">
                <span className='sr-only'>imei</span>
              </TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Model' : 'Modelo'}</TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Color' : 'Color'}</TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Storage' : 'Capacidad'}</TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Battery' : 'Bateria'}</TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Price' : 'Precio'}</TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Cost' : 'Costo'}</TableHead>
              <TableHead className="whitespace-nowrap">{isEnglish ? 'Details' : 'Detalles'}</TableHead>
              <TableHead>
                <span className='sr-only'>actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((iphone, i) => (
              <TableProductRow 
                phone={iphone} 
                index={i} 
                key={i} 
                models={models}
                iphonesLS={iphonesLS}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
