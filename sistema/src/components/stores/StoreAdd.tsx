import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import useField from '@/hooks/useField';
import {
  BuildingIcon,
  LoaderCircleIcon,
  StoreIcon,
  WarehouseIcon,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  handleAdd: (name: string, icon: string) => void;
  loading: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function StoreAdd({ handleAdd, loading, open, setOpen }: Props) {
  const { t } = useTranslation();
  const name = useField({ type: 'text' });
  const icon = useField({ type: 'text', initialValue: 'store' });

  const iconsList = [
    { value: 'store', icon: StoreIcon },
    { value: 'building', icon: BuildingIcon },
    { value: 'warehouse', icon: WarehouseIcon },
  ];

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant={'link'} className='h-full w-full'>
          {t('stores.newStore')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('stores.newStore')}</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          <div>
            <Label htmlFor='name' className='text-xs'>
              {t('common.name')}
            </Label>
            <Input id='name' name='name' {...name} />
          </div>
          <div>
            <Label htmlFor='icon' className='text-xs'>
              Icon
            </Label>
            <RadioGroup
              defaultValue='store'
              className='flex items-center'
              value={icon.value}
              onValueChange={icon.onChange}
            >
              {iconsList.map((item, i) => (
                <Label
                  key={i}
                  htmlFor={`rd${i}`}
                  className={twMerge(
                    icon.value === item.value
                      ? 'bg-zinc-400 text-white'
                      : 'bg-zinc-100 text-zinc-700',
                    'p-2 rounded-lg cursor-pointer hover:opacity-80'
                  )}
                >
                  <RadioGroupItem
                    value={item.value}
                    id={`rd${i}`}
                    className='hidden'
                  />
                  <item.icon className='stroke-1 ' />
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            disabled={loading}
            onClick={() => handleAdd(name.value, icon.value)}
          >
            {loading ? (
              <LoaderCircleIcon className='stroke-1 h-5 w-5 animate-spin' />
            ) : (
              t('common.add')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
