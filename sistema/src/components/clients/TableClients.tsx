'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EditIcon, InfoIcon, HistoryIcon } from 'lucide-react';
import ClientDetails from './ClientDetails';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import usePagination from '@/hooks/usePagination';
import { IClient } from '@/interfaces/schemas.interfaces';
import Pagination from '../common/Pagination';
import { toTitleCase } from '@/helpers/toTitleCase';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  data: IClient[];
  pagination: {
    page: number;
    total: number;
    perPage: number;
    from: number;
    to: number;
  };
  query: { [key: string]: string };
}

export default function TableClients({ data, pagination, query }: Props) {
  const { t } = useTranslation();
  const { nextPage, previousPage } = usePagination('/clientes', query);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <>
      <ClientDetails
        clientId={selectedClientId || ''}
        open={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    <Card className='lg:col-span-3 order-last lg:order-first'>
      <CardHeader>
        <CardTitle>{t('clients.title')}</CardTitle>
        <CardDescription>{t('clients.listDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {pagination.total === 0 ? (
          <p className='text-center text-slate-400'>
            {t('clients.noClients')}
          </p>
        ) : (
          <>
            {/* Vista Mobile - Tarjetas */}
            <div className="md:hidden space-y-2">
              {data.map((client, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700 p-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{toTitleCase(client.name)}</h3>
                      <p className="text-xs text-muted-foreground">{client.dni || '-'}</p>
                      {client.zone && (
                        <p className="text-xs text-muted-foreground mt-1">{toTitleCase(client.zone)}</p>
                      )}
                      {client.page && (
                        <p className="text-xs text-blue-500">@{client.page}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedClientId(client.id)}
                        className='text-blue-600 hover:text-blue-800 p-1'
                      >
                        <HistoryIcon className='h-5 w-5 stroke-1' />
                      </button>
                      <Link href={`/clientes/editar/${client.id}`} className="p-1">
                        <EditIcon className='h-5 w-5 stroke-1' />
                      </Link>
                      <Link href={`/clientes/${client.id}`} className="p-1">
                        <InfoIcon className='h-5 w-5 stroke-1' />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Desktop - Tabla */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.name')}</TableHead>
                  <TableHead>{t('addClient.dni')}</TableHead>
                  <TableHead>{t('addClient.zone')}</TableHead>
                  <TableHead>{t('addClient.page')}</TableHead>
                  <TableHead className=''>
                    <span className='sr-only'>actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((client, i) => (
                  <TableRow key={i}>
                    <TableCell>{toTitleCase(client.name)}</TableCell>
                    <TableCell>{client.dni}</TableCell>
                    <TableCell>{toTitleCase(client.zone)}</TableCell>
                    <TableCell>@{client.page ? client.page : '-'}</TableCell>
                    <TableCell className='flex items-center justify-end gap-2 lg:gap-4'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <button
                              onClick={() => setSelectedClientId(client.id)}
                              className='text-blue-600 hover:text-blue-800'
                            >
                              <HistoryIcon className='h-5 w-5 stroke-1' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('clients.viewHistory')}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Link href={`/clientes/editar/${client.id}`}>
                              <EditIcon className='h-5 w-5 stroke-1' />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('common.edit')}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Link href={`/clientes/${client.id}`}>
                              <InfoIcon className='h-5 w-5 stroke-1' />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('clients.view')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Pagination
          currPage={pagination.page}
          nextPage={nextPage}
          previousPage={previousPage}
          perPage={pagination.perPage}
          totalItems={pagination.total}
        />
      </CardFooter>
    </Card>
    </>
  );
}
