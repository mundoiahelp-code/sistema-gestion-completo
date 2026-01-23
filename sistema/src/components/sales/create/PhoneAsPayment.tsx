import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import useDynamicInput from '@/hooks/useDynamicInput';
import useField from '@/hooks/useField';
import useSelectIPhone from '@/hooks/useSelectIPhone';
import { useTranslation } from '@/i18n/I18nProvider';
import { IPhone } from '@/interfaces/schemas.interfaces';

interface IPhonePayment {
  model: string;
  color: string;
  storage: string;
  battery: string;
  price: number;
}

interface Props {
  items: IPhonePayment[];
  setItems: React.Dispatch<React.SetStateAction<IPhonePayment[]>>;
}

export default function PhoneAsPayment({ items, setItems }: Props) {
  const { handleAdd, handleUpdate, handleDelete } =
    useDynamicInput<IPhonePayment>();
  const { t, locale } = useTranslation();

  if (items.length === 0)
    return (
      <ModalPhone
        text={t('sales.phoneAsPayment')}
        cb={(props) => {
          handleAdd(props, setItems);
        }}
      />
    );

  return (
    <div>
      <span className='font-light'>{t('sales.phoneAsPayment')}</span>
      <ul className='mb-4 mt-2'>
        {items.map((item, i) => (
          <li
            key={i}
            className='flex items-center mb-2 justify-between text-sm bg-gray-50 dark:bg-zinc-800 p-1 rounded-lg'
          >
            <div className='text-gray-700 dark:text-zinc-300 w-full'>
              <p className='mb-1'>
                {item.model} {item.color} {item.storage} {item.battery}%
              </p>
              <div className='flex items-center justify-between w-full'>
                <div className='relative w-1/2'>
                  <Input
                    value={item.price}
                    onChange={(e) => {
                      const re = /^[0-9\b]+$/;

                      if (e.target.value === '' || re.test(e.target.value)) {
                        handleUpdate('price', e.target.value, i, setItems);
                      }
                    }}
                    className='w-full bg-white dark:bg-zinc-900'
                    maxLength={3}
                    placeholder={locale === 'es' ? 'Precio USD' : 'Price USD'}
                  />
                  <Badge
                    className='absolute top-1.5 right-2'
                    variant={'outline'}
                  >
                    $
                  </Badge>
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    onClick={() => {
                      handleDelete(i, setItems);
                    }}
                    variant={'outline'}
                  >
                    <TrashIcon className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ModalPhone
        text={t('sales.addAnother')}
        cb={(props) => {
          handleAdd(props, setItems);
        }}
      />
    </div>
  );
}

const ModalPhone = ({
  text,
  cb,
}: {
  text: string;
  cb: (props: IPhonePayment) => void;
}) => {
  const imei = useField({ type: 'text', validation: /^[0-9]*$/ });
  const model = useField({ type: 'text' });
  const color = useField({ type: 'text' });
  const storage = useField({ type: 'text' });
  const battery = useField({ type: 'text', validation: /^[0-9]*$/ });
  const price = useField({ type: 'text', validation: /^[0-9]*$/ });
  const { locale } = useTranslation();

  const { models, iphonesLS } = useSelectIPhone();

  const [colors, setColors] = useState<string[]>([]);
  const [storages, setStorages] = useState<string[]>([]);

  useEffect(() => {
    if (model.value && iphonesLS && iphonesLS.length > 0) {
      const IPHONE = iphonesLS.find((x) => x?.model === model.value);
      if (IPHONE) {
        setColors(IPHONE.colors || []);
        setStorages(IPHONE.storages || []);
      }
    }
  }, [model.value, iphonesLS]);

  const [copied, setCopied] = useState(false);

  const handleVerifyImei = async () => {
    if (imei.value && imei.value.length === 15) {
      // Copiar IMEI al portapapeles
      try {
        await navigator.clipboard.writeText(imei.value);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
      // Abrir ENACOM
      window.open('https://enacom.gob.ar/imei', '_blank');
    }
  };

  const isDisabled = Boolean(
    !model.value ||
      !color.value ||
      !storage.value ||
      !battery.value ||
      !price.value
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger className='text-center'>
        <Button className='bg-gray-500 w-full'>{text}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{locale === 'es' ? 'Celular como metodo de pago' : 'Phone as payment method'}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className='flex flex-col gap-2'>
          {/* IMEI con verificación */}
          <div className='flex gap-2'>
            <Input
              {...imei}
              className='flex-1'
              maxLength={15}
              placeholder={locale === 'es' ? 'IMEI (15 dígitos)' : 'IMEI (15 digits)'}
            />
            <Button
              type='button'
              variant='outline'
              onClick={handleVerifyImei}
              disabled={imei.value.length !== 15}
              className='whitespace-nowrap text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            >
              {locale === 'es' ? 'Verificar IMEI' : 'Verify IMEI'}
            </Button>
          </div>
          {imei.value && imei.value.length !== 15 && (
            <p className='text-xs text-amber-600'>
              {locale === 'es' 
                ? `El IMEI debe tener 15 dígitos (${imei.value.length}/15)` 
                : `IMEI must have 15 digits (${imei.value.length}/15)`}
            </p>
          )}
          {copied && (
            <p className='text-xs text-green-600'>
              {locale === 'es' ? '✓ IMEI copiado! Pegalo en ENACOM con Ctrl+V' : '✓ IMEI copied! Paste it with Ctrl+V'}
            </p>
          )}
          
          <Select value={model.value} onValueChange={model.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={locale === 'es' ? 'Modelo' : 'Model'} />
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
          <Select value={color.value} onValueChange={color.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={locale === 'es' ? 'Color' : 'Color'} />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color, i) => (
                <SelectItem value={color} key={i}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={storage.value} onValueChange={storage.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={locale === 'es' ? 'Capacidad' : 'Storage'} />
            </SelectTrigger>
            <SelectContent>
              {storages.map((storage, i) => (
                <SelectItem value={storage} key={i}>
                  {storage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className='relative'>
            <Input
              {...battery}
              onChange={(e) => {
                if (+e.target.value > 100) {
                  return battery.onChange('100');
                }
                battery.onChange(e);
              }}
              className='w-full'
              maxLength={3}
              placeholder={locale === 'es' ? 'Bateria' : 'Battery'}
            />
            <Badge className='absolute top-1.5 right-2' variant={'outline'}>
              %
            </Badge>
          </div>
          <div className='relative'>
            <Input
              {...price}
              className='w-full'
              maxLength={3}
              placeholder={locale === 'es' ? 'Precio USD' : 'Price USD'}
            />
            <Badge className='absolute top-1.5 right-2' variant={'outline'}>
              $
            </Badge>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{locale === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDisabled}
            onClick={() => {
              cb({
                model: model.value,
                color: color.value,
                storage: storage.value,
                battery: battery.value,
                price: +price.value,
              });
              imei.onChange('');
              model.onChange('');
              color.onChange('');
              storage.onChange('');
              battery.onChange('');
              price.onChange('');
            }}
          >
            {locale === 'es' ? 'Agregar' : 'Add'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
