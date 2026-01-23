import { Trash2Icon } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { OrderContext } from '@/context/order/order.context';
import { OrderTypes } from '@/context/order/order.types';
import { IPhone } from '@/interfaces/phone.interface';

interface IPhoneData {
  model: string;
  colors: string[];
  storages: string[];
}

interface Props {
  phone: IPhone;
  index: number;
  models: { [key: string]: string[] };
  iphonesLS: IPhoneData[];
}

export default function TableProductRow({
  phone,
  index,
  models,
  iphonesLS,
}: Props) {
  const { state, dispatch } = useContext(OrderContext);
  const { phones } = state;

  const [colors, setColors] = useState<string[]>([]);
  const [storages, setStorages] = useState<string[]>([]);

  const changeModel = (modelSelected: string) => {
    const IPHONE = iphonesLS.find((x) => x.model === modelSelected);
    dispatch({
      type: OrderTypes.UPDATE_ONE,
      payload: { index, property: 'model', value: modelSelected },
    });
    if (IPHONE) {
      setColors(IPHONE.colors || []);
      setStorages(IPHONE.storages || []);
    }
  };

  const changeProperty = (property: string, value: string): void => {
    dispatch({
      type: OrderTypes.UPDATE_ONE,
      payload: { index, property, value },
    });
  };

  const validateNumber = (field: string, text: string) => {
    const regex = /^[0-9 ]*$/;

    if (!regex.test(text)) return;
    const num = +text;
    if (field === 'battery') {
      if (num > 100) return changeProperty(field, '100');
    }
    if (num < 0) return changeProperty(field, '0');
    changeProperty(field, text);
  };

  const handleRemove = () => {
    dispatch({ type: OrderTypes.PRODUCT_DELETE, payload: { index: index } });
  };

  useEffect(() => {
    if (phone.model) {
      const IPHONE = iphonesLS.find((x) => x.model === phone.model);
      if (IPHONE) {
        setColors(IPHONE.colors || []);
        setStorages(IPHONE.storages || []);
      }
    }
  }, [phone.model, iphonesLS]);

  return (
    <TableRow>
      <TableCell className="text-slate-400 font-semibold text-xs whitespace-nowrap">
        {phone.imei}
      </TableCell>
      <TableCell>
        <Select value={phones[index].model} onValueChange={changeModel}>
          <SelectTrigger className="w-[130px] md:w-[170px] text-xs md:text-sm">
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent className="h-64">
            {Object.entries(models)
              .sort((a, b) => +b[0] - +a[0])
              .map((group, i) => (
                <SelectGroup key={i}>
                  <SelectLabel>
                    {group[0] === '10' ? 'X' : group[0]}
                  </SelectLabel>
                  {group[1].map((model, modelI) => (
                    <SelectItem value={model} key={modelI}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Select
          value={phones[index].color}
          onValueChange={(e) => changeProperty('color', e)}
          disabled={colors.length === 0}
        >
          <SelectTrigger className="w-[120px] md:w-[150px] text-xs md:text-sm">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            {colors.map((color, i) => (
              <SelectItem value={color} key={i}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Select
          value={phones[index].storage}
          onValueChange={(e) => changeProperty('storage', e)}
          disabled={storages.length === 0}
        >
          <SelectTrigger className="w-[90px] md:w-[110px] text-xs md:text-sm">
            <SelectValue placeholder="GB" />
          </SelectTrigger>
          <SelectContent>
            {storages.map((storage, i) => (
              <SelectItem value={storage} key={i}>
                {storage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="relative w-[80px] md:w-[100px]">
          <Input
            value={phones[index].battery}
            onChange={(e) => validateNumber('battery', e.target.value)}
            className="w-full text-xs md:text-sm"
            maxLength={3}
          />
          <Badge className="absolute top-1.5 right-2 text-xs" variant={'outline'}>
            %
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="relative w-[90px] md:w-[120px]">
          <Input
            value={phones[index].price}
            className="w-full pr-12 md:pr-16 text-xs md:text-sm"
            onChange={(e) => validateNumber('price', e.target.value)}
          />
          <Badge className="absolute top-1.5 right-1 md:right-2 text-xs" variant={'outline'}>
            USD
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="relative w-[90px] md:w-[120px]">
          <Input
            value={phones[index].cost || ''}
            placeholder="0"
            className="w-full pr-12 md:pr-16 text-xs md:text-sm"
            onChange={(e) => validateNumber('cost', e.target.value)}
          />
          <Badge className="absolute top-1.5 right-1 md:right-2 text-xs" variant={'outline'}>
            USD
          </Badge>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Opcional</p>
      </TableCell>
      <TableCell>
        <Input
          value={phones[index].details}
          className="w-full text-xs md:text-sm"
          onChange={(e) => changeProperty('details', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Button variant={'outline'} onClick={handleRemove} size="sm" className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3">
          <Trash2Icon className="stroke-1 h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
