'use client';

import { LoaderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  title: string;
  children: React.ReactNode;
  handleConfirm: () => void;
  loading: boolean;
}

export default function CardForm({
  title,
  children,
  handleConfirm,
  loading,
}: Props) {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className='border-t px-0 mt-4 pt-4 pb-0'>
        <Button
          className='min-w-[6rem]'
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <LoaderIcon className='h-4 w-4 animate-pulse' />
          ) : (
            t('common.save')
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
