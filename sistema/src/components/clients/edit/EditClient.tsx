'use client';

import { AtSignIcon, LoaderIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useClient from '@/hooks/useClient';
import { IClient } from '@/interfaces/schemas.interfaces';

interface Props {
  data: IClient;
}

export default function EditClient({ data }: Props) {
  const {
    loading,
    isDisabled,
    handleUpdateClient,
    name,
    dni,
    email,
    page,
    zone,
    phone,
    // discount,
  } = useClient(data);

  return (
    <div className='grid-cols-3 gap-2 grid'>
      <Card className='lg:col-span-2 col-span-3'>
        <CardHeader className='font-light text-xl'>
          <CardTitle>Editar cliente</CardTitle>
          <CardDescription>(*) Campo requerido</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => e.preventDefault()}
            className='grid gap-4 grid-cols-2'
          >
            <div className='col-span-2 grid grid-cols-2'>
              <div className='col-span-2 lg:col-span-1'>
                <Label>Nombre *</Label>
                <Input {...name} />
              </div>
            </div>
            <div className='col-span-2 grid grid-cols-2'>
              <div className='col-span-2 lg:col-span-1'>
                <Label>DNI *</Label>
                <Input {...dni} maxLength={8} placeholder='12345678' />
              </div>
            </div>
            <div className='col-span-2 lg:col-span-1'>
              <div className='col-span-2 lg:col-span-1'>
                <Label>Zona *</Label>
                <Input {...zone} />
              </div>
            </div>
            <div className='col-span-2 lg:col-span-1'>
              <div className='col-span-2 lg:col-span-1'>
                <Label>Pagina</Label>
                <div className='relative'>
                  <span className='absolute text top-2.5 left-2'>
                    <AtSignIcon className='h-5 w-5' />
                  </span>
                  <Input {...page} className='pl-8' />
                </div>
              </div>
            </div>
            <div className='col-span-2 lg:col-span-1'>
              <div className='col-span-2 lg:col-span-1'>
                <Label>Email</Label>
                <Input {...email} placeholder='domimio@email.com' />
              </div>
            </div>
            <div className='col-span-2 lg:col-span-1'>
              <div className='col-span-2 lg:col-span-1'>
                <Label>Telefono</Label>
                <Input {...phone} placeholder='1112345678' />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className='border-t px-0 py-3 mt-3'>
          <Button onClick={handleUpdateClient} disabled={loading || isDisabled}>
            {loading ? (
              <LoaderIcon className='h-4 w-4 animate-pulse' />
            ) : (
              'Editar'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
