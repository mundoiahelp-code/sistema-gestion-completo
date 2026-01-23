import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useField from '@/hooks/useField';
import { XIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  searchImei: (imei: string) => void;
  imeiUsed: string;
  deleteImei: () => void;
}

export default function SearchImei({
  searchImei,
  imeiUsed,
  deleteImei,
}: Props) {
  const { t } = useTranslation();
  const imei = useField({
    type: 'text',
    initialValue: imeiUsed,
    validation: /^[0-9]*$/,
  });

  return (
    <div className='w-full my-2 flex gap-1 items-center'>
      <Input
        placeholder={t('products.searchByImei')}
        maxLength={15}
        {...imei}
        className='bg-white dark:bg-zinc-900 w-full lg:w-1/6'
      />
      <Button variant={'outline'} onClick={() => searchImei(imei.value)}>
        {t('common.search')}
      </Button>
      {imeiUsed && (
        <Button
          variant={'outline'}
          className='stroke-1 text-red-900'
          onClick={() => {
            deleteImei();
            imei.onChange('');
          }}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
