import { TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Payment } from '@/enums/payment.enum';
import useDynamicInput from '@/hooks/useDynamicInput';

type PaymentType = { type: Payment; amount: string };

interface Props {
  payment: PaymentType[];
  setPayment: React.Dispatch<React.SetStateAction<PaymentType[]>>;
}

const paymentMethods = [
  { name: 'Efectivo - Pesos', value: Payment.EFECTIVE_ARS },
  { name: 'Efectivo - USD', value: Payment.EFECTIVE_USD },
  { name: 'Efectivo - Euros', value: Payment.EFECTIVE_EUROS },
  { name: 'Transferencia - Pesos', value: Payment.TRANSFER_ARS },
  { name: 'Transferencia - USDT', value: Payment.TRANSFER_USDT },
];

export default function PaymentSelect({ payment, setPayment }: Props) {
  const structure: PaymentType = {
    amount: '0',
    type: '' as Payment,
  };

  const { handleAdd, handleDelete, handleUpdate } =
    useDynamicInput<PaymentType>();

  return (
    <Label className='grid gap-2'>
      <span className='font-light'>Medio/s de pago</span>
      {payment.map((x, i) => (
        <div key={i} className='flex items-center gap-2 mb-4 lg:mb-0'>
          <div className='flex justify-center flex-col lg:items-center gap-2 lg:flex-row w-full'>
            <Select
              value={x.type}
              onValueChange={(value: Payment) =>
                handleUpdate('type', value, i, setPayment)
              }
            >
              <SelectTrigger className={'font-light'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((p, i) => (
                  <SelectItem value={p.value} key={i}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='relative w-full'>
              <span className='absolute text-xl top-[.20rem] left-2 text-gray-600'>
                $
              </span>
              <Input
                value={x.amount}
                onChange={(e) => {
                  const re = /^[0-9\b]+$/;

                  if (e.target.value === '' || re.test(e.target.value)) {
                    handleUpdate('amount', e.target.value, i, setPayment);
                  }
                }}
                placeholder=''
                className='placeholder:text-slate-400 font-light text-lg pl-8'
              />
            </div>
          </div>
          {payment.length > 1 && (
            <Button
              variant={'outline'}
              onClick={() => handleDelete(i, setPayment)}
            >
              <TrashIcon className='h-4 w-4' />
            </Button>
          )}
        </div>
      ))}
      <Button
        className='w-1/3'
        variant={'outline'}
        onClick={() => handleAdd(structure, setPayment)}
      >
        +
      </Button>
    </Label>
  );
}
