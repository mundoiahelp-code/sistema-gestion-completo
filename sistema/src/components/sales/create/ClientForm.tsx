import { Loader } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useField from '@/hooks/useField';
import { useTranslation } from '@/i18n/I18nProvider';
import { IClient } from '@/interfaces/schemas.interfaces';

interface Props {
  handleSearchClients: (
    search: string
  ) => Promise<IClient[] | void>;
  handleSelectClient: (client: IClient) => void;
  handleSkipClient: () => void;
  loading: boolean;
}

export default function ClientForm({
  handleSearchClients,
  handleSelectClient,
  handleSkipClient,
  loading,
}: Props) {
  const [searched, setSearched] = useState(false);
  const [clients, setClients] = useState<IClient[]>([]);
  const [total, setTotal] = useState<number>(0);
  const { t, locale } = useTranslation();

  const typed = useField({ type: 'text' });

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await handleSearchClients(typed.value);

    if (Array.isArray(data)) {
      setSearched(true);
      setClients(data);
      setTotal(data.length);
    }
  };

  return (
    <>
      <div className='grid-cols-3 gap-4 w-full grid'>
        {/* SEARCH */}
        <div className='col-span-3 lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'es' ? 'Seleccionar cliente (opcional)' : 'Select client (optional)'}</CardTitle>
              <CardDescription>
                {locale === 'es' ? 'Busque un cliente o continúe sin cliente' : 'Search for a client or continue without one'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <form onSubmit={onSearch} className='flex items-center gap-2'>
                <Input {...typed} placeholder={locale === 'es' ? 'Ingresar...' : 'Enter...'} />
                <Button disabled={typed.value.length <= 3} type='submit'>
                  {t('common.search')}
                </Button>
              </form>
              <Button 
                variant='outline' 
                className='w-full' 
                onClick={handleSkipClient}
                type='button'
              >
                {locale === 'es' ? 'Continuar sin cliente' : 'Continue without client'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className='col-span-3 mt-8 w-full flex justify-center'>
            <Loader className='h-8 w-8 animate-spin text-slate-600' />
          </div>
        )}

        {/* RESULTS */}
        {clients.length > 0 && (
          <div className='col-span-3 lg:col-span-1'>
            <h3 className='mb-2'>{locale === 'es' ? 'Resultados' : 'Results'}: ({total})</h3>
            <div className='grid gap-3'>
              {clients.map((client, i) => (
                <Card key={i} className='p-3'>
                  <CardContent className=''>
                    <ul className='mb-4'>
                      <li>
                        <span className='font-semibold'>{t('common.name')}:</span>{' '}
                        <span>{client.name}</span>{' '}
                      </li>
                      <li>
                        <span className='font-semibold'>{locale === 'es' ? 'DNI' : 'ID'}:</span>{' '}
                        <span>{client.dni}</span>{' '}
                      </li>
                      <li>
                        <span className='font-semibold'>{locale === 'es' ? 'Zona' : 'Zone'}:</span>{' '}
                        <span>{client.zone ? client.zone : '-'}</span>{' '}
                      </li>
                      <li>
                        <span className='font-semibold'>{locale === 'es' ? 'Pagina' : 'Page'}:</span>{' '}
                        <span>{client.page ? client.page : '-'}</span>{' '}
                      </li>
                    </ul>
                    <div className='w-full text-right'>
                      <Button onClick={() => handleSelectClient(client)}>
                        {t('common.select')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {clients.length === 0 && searched && (
          <p className='text-center col-span-3 mt-8'>
            {t('clients.noClients')}
          </p>
        )}
      </div>
    </>
  );
}
