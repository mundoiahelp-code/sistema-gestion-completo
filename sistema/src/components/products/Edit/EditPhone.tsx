import { FilePenIcon, LoaderIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import useField from '@/hooks/useField';
import useLocalStorage from '@/hooks/useLocalStorage';
import { IPhone } from '@/interfaces/schemas.interfaces';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  data: IPhone;
  handleDelete: (id: string, i: number) => void;
  handleEdit: (
    id: string,
    index: number,
    data: { [key: string]: string }
  ) => Promise<void>;
  index: number;
  models: { [key: string]: string[] };
  iphonesLS: { storages: string[]; colors: string[]; model: string }[];
}

export default function EditPhone({
  data,
  handleDelete,
  handleEdit,
  index,
  models,
  iphonesLS,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // const [iphonesLS, setIphonesLS] = useLocalStorage('iphones', []);

  const model = useField({ type: 'text', initialValue: data.model });
  const color = useField({ type: 'text', initialValue: data.color });
  const storage = useField({ type: 'text', initialValue: data.storage });
  const battery = useField({
    type: 'text',
    initialValue: '' + data.battery,
    validation: /^[0-9]*$/,
  });
  const price = useField({
    type: 'text',
    initialValue: '' + data.price,
    validation: /^[0-9]*$/,
  });
  const cost = useField({
    type: 'text',
    initialValue: data.cost ? '' + data.cost : '',
    validation: /^[0-9]*$/,
  });
  const details = useField({ type: 'text', initialValue: data.details });

  const [colors, setColors] = useState<string[]>(['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Morado', 'Rosa', 'Amarillo', 'Gris']);
  const [storages, setStorages] = useState<string[]>(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']);

  const changeModel = (modelSelected: string) => {
    if (iphonesLS.length === 0) return;
    const IPHONE = iphonesLS.find((x) => x.model === modelSelected);
    if (IPHONE) {
      setColors(IPHONE.colors);
      setStorages(IPHONE.storages);
      model.onChange(modelSelected);
    }
  };

  const onOpenChange = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (iphonesLS.length === 0) return;
    const IPHONE = iphonesLS.find((x) => x.model === data.model);
    if (IPHONE) {
      setColors(IPHONE.colors);
      setStorages(IPHONE.storages);
    }
  }, [models]);

  const confirmEdit = async () => {
    if (
      !model.value ||
      !color.value ||
      !storage.value ||
      !battery.value ||
      !price.value
    )
      return;

    setLoading(true);
    await handleEdit(data.id, index, {
      model: model.value,
      color: color.value,
      storage: storage.value,
      battery: battery.value,
      price: price.value,
      cost: cost.value || undefined, // Opcional
      details: details.value,
    });
    setOpen(false);
    setLoading(false);
  };

  useEffect(() => {
    model.onChange(data.model);
    color.onChange(data.color);
    storage.onChange(data.storage);
    battery.onChange('' + data.battery);
    price.onChange('' + data.price);
    cost.onChange(data.cost ? '' + data.cost : '');
    details.onChange(data.details);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <FilePenIcon className='stroke-1 h-5 w-5 hover:opacity-80 cursor-pointer' />
      </SheetTrigger>
      <SheetContent side={'right'}>
        <SheetHeader>
          <SheetTitle>{t('products.editPhone')}</SheetTitle>
          <SheetDescription>{data.imei}</SheetDescription>
        </SheetHeader>
        <div className='grid gap-4   mt-8'>
          <Label>
            {t('products.model')}
            <Select value={model.value} onValueChange={changeModel}>
              <SelectTrigger>
                <SelectValue placeholder={t('products.model')} />
              </SelectTrigger>
              <SelectContent className='h-64'>
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
          </Label>
          <Label>
            {t('products.color')}
            <Select value={color.value} onValueChange={color.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('products.color')} />
              </SelectTrigger>
              <SelectContent>
                {colors?.map((color, i) => (
                  <SelectItem value={color} key={i}>
                    {color}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </Label>
          <Label>
            {t('products.storage')}
            <Select value={storage.value} onValueChange={storage.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('products.storage')} />
              </SelectTrigger>
              <SelectContent>
                {storages?.map((storage, i) => (
                  <SelectItem value={storage} key={i}>
                    {storage}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </Label>
          <div className='grid grid-cols-2 gap-2'>
            <Label>
              {t('products.battery')}
              <div className='relative'>
                <Input {...battery} />
                <Badge className='absolute top-1.5 right-2' variant={'outline'}>
                  %
                </Badge>
              </div>
            </Label>
            <Label>
              {t('common.price')}
              <div className='relative'>
                <Input {...price} />
                <Badge className='absolute top-1.5 right-2' variant={'outline'}>
                  $
                </Badge>
              </div>
            </Label>
          </div>
          <Label>
            Costo (opcional)
            <div className='relative'>
              <Input {...cost} placeholder="Costo de compra" />
              <Badge className='absolute top-1.5 right-2' variant={'outline'}>
                $
              </Badge>
            </div>
            {/* Nota: Todos los roles pueden ingresar costo, pero solo ADMIN ve ganancias */}
          </Label>
          <Label>
            {t('common.details')}
            <Textarea
              rows={4}
              value={details.value}
              onChange={(e) => details.onChange(e.target.value)}
            />
          </Label>
        </div>
        <div className='mt-4 grid grid-cols-2 gap-4'>
          <div>
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant={'outline'} className='hover:text-red-700'>
                  <Trash2Icon className='stroke-1 h-5 w-5' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('products.deleteConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('products.deleteConfirmDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      handleDelete(data.id, index);
                      setOpen(false);
                    }}
                  >
                    {t('common.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div>
            <Button onClick={confirmEdit} className='w-full'>
              {loading ? <LoaderIcon className='animate-spin' /> : t('common.edit')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
