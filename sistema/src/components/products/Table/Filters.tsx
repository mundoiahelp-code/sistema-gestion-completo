import LoadingPage from '@/components/layout/LoadingPage';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
} from '@/components/ui/select';
import { getQuery } from '@/helpers/getQuery';
import { toTitleCase } from '@/helpers/toTitleCase';
import useField from '@/hooks/useField';
import useSelectIPhone from '@/hooks/useSelectIPhone';
import useStores from '@/hooks/useStores';
import { useTranslation } from '@/i18n/I18nProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Filters() {
  const { t, locale } = useTranslation();
  const model = useField({ type: 'text' });
  const storage = useField({ type: 'text' });
  const color = useField({ type: 'text' });
  const minBattery = useField({
    type: 'text',
    initialValue: '0',
    validation: /^[0-9]*$/,
  });
  const maxBattery = useField({
    type: 'text',
    initialValue: '100',
    validation: /^[0-9]*$/,
  });
  const store = useField({
    type: 'text',
  });

  const [filters, setFilters] = useState(false);

  const { models, iphonesLS } = useSelectIPhone();
  const { stores, loadingStores } = useStores();

  const router = useRouter();
  const query = useSearchParams();

  // Obtener colores disponibles según el modelo seleccionado
  const getAvailableColors = () => {
    if (!model.value) return [];
    const selectedPhone = iphonesLS.find(p => p.model === model.value);
    return selectedPhone ? selectedPhone.colors : [];
  };

  // Obtener capacidades disponibles según el modelo seleccionado
  const getAvailableStorages = () => {
    if (!model.value) {
      // Si no hay modelo seleccionado, mostrar todas las capacidades
      return ['32gb', '64gb', '128gb', '256gb', '512gb', '1tb'];
    }
    const selectedPhone = iphonesLS.find(p => p.model === model.value);
    return selectedPhone ? selectedPhone.storages : [];
  };

  const handleConfrmFilter = () => {
    const obj: { [key: string]: string } = {};

    if (model.value) obj['model'] = model.value;
    if (storage.value) obj['storage'] = storage.value;
    if (color.value) obj['color'] = color.value;
    if (minBattery.value) obj['minBattery'] = minBattery.value;
    if (maxBattery.value) obj['maxBattery'] = maxBattery.value;
    if (store.value) obj['store'] = store.value;

    if (Object.keys(obj).length > 0) {
      router.push(`/productos?${getQuery(obj)}`);
      router.refresh();
      setFilters(true);
    }
  };

  const handleConfirmDeleteFilters = () => {
    model.onChange('');
    storage.onChange('');
    color.onChange('');
    minBattery.onChange('');
    maxBattery.onChange('');
    store.onChange('');

    router.push(`/productos`);
    router.refresh();
    setFilters(false);
  };

  // Limpiar color y storage cuando cambie el modelo
  useEffect(() => {
    if (model.value) {
      const selectedPhone = iphonesLS.find(p => p.model === model.value);
      if (selectedPhone) {
        // Si el color actual no está en los colores del nuevo modelo, limpiarlo
        if (color.value && !selectedPhone.colors.includes(color.value)) {
          color.onChange('');
        }
        // Si el storage actual no está en las capacidades del nuevo modelo, limpiarlo
        if (storage.value && !selectedPhone.storages.includes(storage.value)) {
          storage.onChange('');
        }
      }
    }
  }, [model.value]);

  useEffect(() => {
    const qy = (val: string) => query.get(val);

    let total = 0;

    if (qy('model')) {
      model.onChange(qy('model') ?? '');
      total++;
    }
    if (qy('storage')) {
      storage.onChange(qy('storage') ?? '');
      total++;
    }
    if (qy('color')) {
      color.onChange(qy('color') ?? '');
      total++;
    }
    if (qy('minBattery')) {
      minBattery.onChange(qy('minBattery') ?? '');
      total++;
    }
    if (qy('maxBattery')) {
      maxBattery.onChange(qy('maxBattery') ?? '');
      total++;
    }
    if (qy('store')) {
      store.onChange(qy('store') ?? '');
      total++;
    }

    if (total > 0) {
      setFilters(true);
    }
  }, []);

  if (loadingStores) return <LoadingPage />;

  return (
    <Accordion type='single' collapsible>
      <AccordionItem value='item-1' className='bg-white dark:bg-zinc-900 mb-2 px-4 rounded-lg border dark:border-zinc-800'>
        <AccordionTrigger>{locale === 'es' ? 'Filtros' : 'Filters'}</AccordionTrigger>
        <AccordionContent className='grid grid-cols-1 lg:grid-cols-3 px-4 gap-3'>
          <div>
            <Label>{t('products.model')}</Label>
            <Select value={model.value} onValueChange={model.onChange}>
              <SelectTrigger>
                {model.value ? model.value : (locale === 'es' ? 'Seleccionar modelo' : 'Select model')}
              </SelectTrigger>
              <SelectContent>
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
          <div>
            <Label>{t('products.color')}</Label>
            <Select 
              value={color.value} 
              onValueChange={color.onChange}
              disabled={!model.value}
            >
              <SelectTrigger disabled={!model.value}>
                {!model.value 
                  ? (locale === 'es' ? 'Seleccioná un modelo primero' : 'Select a model first')
                  : color.value 
                    ? color.value 
                    : (locale === 'es' ? 'Seleccionar color' : 'Select color')}
              </SelectTrigger>
              <SelectContent>
                {getAvailableColors().map((c, i) => (
                  <SelectItem value={c} key={i}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('products.storage')}</Label>
            <Select value={storage.value} onValueChange={storage.onChange}>
              <SelectTrigger>
                {storage.value ? storage.value.toUpperCase() : (locale === 'es' ? 'Seleccionar capacidad' : 'Select storage')}
              </SelectTrigger>
              <SelectContent>
                {getAvailableStorages().map((s, i) => (
                  <SelectItem value={s} key={i}>
                    {s.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('products.battery')}</Label>
            <div className='flex gap-2 items-center '>
              <div className='relative lg:w-[130px]'>
                <Input {...minBattery} className='pr-8' />
                <span className='absolute top-1 right-2 text-xl'>%</span>
              </div>
              {locale === 'es' ? 'a' : 'to'}
              <div className='relative lg:w-[130px]'>
                <Input {...maxBattery} />
                <span className='absolute top-1 right-2 text-xl'>%</span>
              </div>
            </div>
          </div>
          <div>
            <Label>{t('products.store')}</Label>
            <Select value={store.value} onValueChange={store.onChange}>
              <SelectTrigger>
                {store.value ? store.value.split('_')[1] : (locale === 'es' ? 'Seleccionar tienda' : 'Select store')}
              </SelectTrigger>
              <SelectContent>
                {stores.map((store, i) => (
                  <SelectItem value={`${store.id}_${store.name}`} key={i}>
                    {toTitleCase(store.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='lg:col-start-3 flex justify-end gap-3'>
            {filters && (
              <Button variant={'outline'} onClick={handleConfirmDeleteFilters}>
                {locale === 'es' ? 'Borrar filtros' : 'Clear filters'}
              </Button>
            )}
            <Button onClick={handleConfrmFilter}>{t('common.filter')}</Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
