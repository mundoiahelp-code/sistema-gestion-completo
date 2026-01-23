import { useState } from 'react';
import { twJoin } from 'tailwind-merge';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { colorClass } from '@/lib/preferences';
import CardForm from './CardForm';

interface Props {
  handleConfirm: (key: string, value: string) => void;
  loading: boolean;
  userName: string;
  defaultValue: string;
}

export default function IconColor({
  handleConfirm,
  loading,
  userName,
  defaultValue,
}: Props) {
  const [colorActive, setColorActiver] = useState(defaultValue);

  const colors: string[] = Object.keys(colorClass);

  return (
    <CardForm
      title='Icono'
      handleConfirm={() => handleConfirm('colorIcon', colorActive)}
      loading={loading}
    >
      <div className='grid md:grid-cols-3 md:gap-4 gap-8'>
        <div className='flex justify-center'>
          <div className='max-w-[14rem]'>
            <RadioGroup
              className='flex flex-wrap items-center gap-4'
              value={colorActive}
              onValueChange={setColorActiver}
            >
              {colors.map((x, i) => (
                <Label
                  key={i}
                  className={twJoin(
                    colorClass[x],
                    x === colorActive ? 'border-2 border-neutral-300' : '',
                    'h-8 w-8 rounded-full cursor-pointer'
                  )}
                >
                  <RadioGroupItem value={x} id={x} className='hidden' />
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>
        <div className='md:col-span-2 flex items-center justify-center select-none'>
          <span
            className={twJoin(
              colorClass[colorActive],
              'overflow-hidden rounded-full uppercase font-light h-20 w-20 text-4xl flex justify-center items-center text-white'
            )}
          >
            {userName && userName.length > 0
              ? userName.length === 1
                ? userName[0][0] + (userName[0][1] || '')
                : userName[0][0] + (userName[1]?.[0] || '')
              : 'U'}
          </span>
        </div>
      </div>
    </CardForm>
  );
}
