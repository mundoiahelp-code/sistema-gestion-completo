'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/helpers/formatDate';
import { IClient, ISale } from '@/interfaces/schemas.interfaces';

interface Props {
  data: { client: IClient; sales: ISale[] };
}

export default function Client({ data }: Props) {
  const router = useRouter();

  const { client, sales } = data;

  const items = [
    { name: 'Nombre', value: client.name },
    { name: 'DNI', value: client.dni },
    { name: 'Pagina', value: `@${client.page}` },
    { name: 'Zona', value: client.zone },
    { name: 'Email', value: client.email },
    { name: 'Telefono', value: client.phone },
    {
      name: 'Creado ',
      value: formatDate(client.createdAt, 'es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    },
  ];

  return (
    <div className='grid lg:grid-cols-2 gap-4'>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {items.map((item, i) => (
                <li className='grid grid-cols-2 md:grid-cols-4' key={i}>
                  <span className='text-gray-600'>{item.name}:</span>
                  <span className='md:col-span-3'>
                    {item.value ? item.value : '-'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <div>
        {sales.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Ultimas 10 ventas</CardTitle>
              <CardDescription>
                <Link
                  href={`/ventas?clientDni=${data.client.dni}`}
                  className='hover:underline'
                >
                  Ver todas
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead className='hidden md:table-cell'>
                      Unidades
                    </TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale, i) => (
                    <TableRow
                      key={i}
                      className='cursor-pointer'
                      onClick={() => router.push(`/ventas/${sale.id}`)}
                    >
                      <TableCell>#{sale.code}</TableCell>
                      <TableCell className='hidden md:table-cell'>
                        {sale.items.length}
                      </TableCell>
                      <TableCell className='text-green-700 font-semibold'>
                        ${sale.totalAmount}
                      </TableCell>
                      <TableCell>
                        {formatDate(sale.createdAt, 'es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <p className='text-center text-xl text-gray-400'>
            Este cliente no tiene ventas
          </p>
        )}
      </div>
    </div>
  );
}
