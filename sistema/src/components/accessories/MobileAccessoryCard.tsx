'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCartIcon, Package, DollarSign } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  item: any;
  onQuickSell: (item: any) => void;
  InfoComponent: React.ComponentType<{ item: any; onUpdate: () => void }>;
  EditComponent: React.ComponentType<{ item: any; onUpdate: () => void }>;
  onUpdate: () => void;
}

export default function MobileAccessoryCard({
  item,
  onQuickSell,
  InfoComponent,
  EditComponent,
  onUpdate,
}: Props) {
  const { t } = useTranslation();
  const reserved = item.reserved || 0;
  const hasReserved = reserved > 0;

  return (
    <Card className={twMerge(
      'relative',
      hasReserved && 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
    )}>
      <CardContent className="pt-3 pb-3 px-3">
        {/* Header: Nombre y Precio */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className={twMerge(
              'font-semibold text-sm',
              hasReserved && 'text-green-600'
            )}>
              {item.name}
            </h3>
            {item.model && (
              <p className="text-xs text-muted-foreground">
                {item.model}
              </p>
            )}
          </div>
          <span className={twMerge(
            'text-lg font-bold',
            hasReserved ? 'text-green-600' : 'text-green-700'
          )}>
            ${item.price?.toLocaleString()}
          </span>
        </div>

        {/* Info Grid */}
        <div className="flex items-center gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className={`px-1.5 py-0.5 rounded ${
              item.stock > 5 
                ? 'bg-green-100 text-green-700' 
                : item.stock > 0 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-red-100 text-red-700'
            }`}>
              {item.stock} {t('products.units')}
            </span>
          </div>
          {reserved > 0 && (
            <span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
              {reserved} res.
            </span>
          )}
        </div>

        {/* Stock por sucursal */}
        {item.stockByStore && item.stockByStore.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.stockByStore.map((store: any, i: number) => (
              <span 
                key={i} 
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
              >
                {store.stock} {store.storeName.substring(0, 3)}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-1 pt-2 border-t">
          <InfoComponent item={item} onUpdate={onUpdate} />
          <Button
            variant='ghost'
            size='sm'
            className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8 p-0'
            onClick={() => onQuickSell(item)}
            title={t('products.sell')}
          >
            <ShoppingCartIcon className='h-4 w-4' />
          </Button>
          <EditComponent item={item} onUpdate={onUpdate} />
        </div>
      </CardContent>
    </Card>
  );
}
