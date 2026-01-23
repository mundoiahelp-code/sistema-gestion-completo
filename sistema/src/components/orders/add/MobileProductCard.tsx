'use client';

import { Trash2Icon } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
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

export default function MobileProductCard({
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
    <Card className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
      
      <CardContent className="pt-4 pb-4 px-4">
        {/* IMEI */}
        <div className="text-xs text-muted-foreground mb-3 font-mono">
          IMEI: {phone.imei}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Modelo */}
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground mb-1 block">Modelo</Label>
            <Select value={phones[index].model} onValueChange={changeModel}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Seleccionar modelo" />
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
          </div>

          {/* Color */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
            <Select
              value={phones[index].color}
              onValueChange={(e) => changeProperty('color', e)}
              disabled={colors.length === 0}
            >
              <SelectTrigger className="w-full text-sm">
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
          </div>

          {/* Capacidad */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Capacidad</Label>
            <Select
              value={phones[index].storage}
              onValueChange={(e) => changeProperty('storage', e)}
              disabled={storages.length === 0}
            >
              <SelectTrigger className="w-full text-sm">
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
          </div>

          {/* Batería */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Batería</Label>
            <div className="relative">
              <Input
                value={phones[index].battery}
                onChange={(e) => validateNumber('battery', e.target.value)}
                className="w-full text-sm pr-8"
                maxLength={3}
                placeholder="100"
              />
              <Badge className="absolute top-1.5 right-2 text-xs" variant="outline">
                %
              </Badge>
            </div>
          </div>

          {/* Precio */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Precio</Label>
            <div className="relative">
              <Input
                value={phones[index].price}
                className="w-full pr-12 text-sm"
                onChange={(e) => validateNumber('price', e.target.value)}
                placeholder="0"
              />
              <Badge className="absolute top-1.5 right-2 text-xs" variant="outline">
                USD
              </Badge>
            </div>
          </div>

          {/* Costo */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Costo <span className="text-[10px] text-gray-400">(opcional)</span>
            </Label>
            <div className="relative">
              <Input
                value={phones[index].cost || ''}
                className="w-full pr-12 text-sm"
                onChange={(e) => validateNumber('cost', e.target.value)}
                placeholder="0"
              />
              <Badge className="absolute top-1.5 right-2 text-xs" variant="outline">
                USD
              </Badge>
            </div>
          </div>

          {/* Detalles */}
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground mb-1 block">Detalles</Label>
            <Input
              value={phones[index].details}
              className="w-full text-sm"
              onChange={(e) => changeProperty('details', e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
