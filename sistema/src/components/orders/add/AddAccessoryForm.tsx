'use client';

import { useState, useEffect } from 'react';
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
  SelectValue,
} from '@/components/ui/select';
import { LoaderIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { useRouter } from 'next/navigation';
import useSonner from '@/hooks/useSonner';
import { useTranslation } from '@/i18n/I18nProvider';
import { toTitleCase } from '@/helpers/toTitleCase';
import { useVisibleAccessories, ACCESSORY_GROUPS } from '@/hooks/useVisibleModels';
import { useHiddenModels } from '@/hooks/useHiddenModels';
import { useVisibleIPhoneModels } from '@/hooks/useVisibleModels';

interface Store {
  id: string;
  name: string;
}

interface AccessoryItem {
  category: string;
  name: string;
  model: string;
  stock: string;
  price: string;
  cost: string;
  description: string;
  storeId: string;
}

interface Props {
  stores: Store[];
}

export default function AddAccessoryForm({ stores }: Props) {
  const router = useRouter();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { visibleModelGroups } = useVisibleIPhoneModels();
  const { visibleAccessoryGroups } = useVisibleAccessories();
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);
  
  const createEmptyItem = (): AccessoryItem => ({
    category: '',
    name: '',
    model: '',
    stock: '1',
    price: '',
    cost: '',
    description: '',
    storeId: stores[0]?.id || '',
  });
  
  const [items, setItems] = useState<AccessoryItem[]>([createEmptyItem()]);

  // Filtrar categorías y tipos visibles
  useEffect(() => {
    setVisibleCategories(Object.keys(visibleAccessoryGroups));
  }, [visibleAccessoryGroups]);

  // Función para obtener tipos visibles de una categoría
  const getVisibleTypes = (category: string): string[] => {
    return visibleAccessoryGroups[category] || [];
  };

  const handleAddItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof AccessoryItem,
    value: string
  ) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async () => {
    const validItems = items.filter((item) => item.name && item.price && item.storeId);
    if (validItems.length === 0) {
      return handleErrorSonner(
        locale === 'es' 
          ? 'Agregá al menos un accesorio con nombre, precio y tienda'
          : 'Add at least one accessory with name, price and store'
      );
    }

    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      const orderItems: { productId: string; quantity: number; price: number }[] = [];
      let total = 0;

      for (const item of validItems) {
        const res = await axios.post(
          `${API}/products`,
          {
            name: item.name,
            model: item.model || undefined,
            stock: +item.stock || 1,
            price: +item.price,
            cost: +item.cost || 0,
            description: item.description || undefined,
            category: 'ACCESSORY',
            storeId: item.storeId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.product) {
          const qty = +item.stock || 1;
          orderItems.push({
            productId: res.data.product.id,
            quantity: qty,
            price: +item.price,
          });
          total += +item.price * qty;
        }
      }

      if (orderItems.length > 0) {
        await axios.post(
          `${API}/orders`,
          {
            items: orderItems,
            total,
            notes: 'Ingreso de accesorios',
            status: 'COMPLETED',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      handleSuccessSonner(locale === 'es' 
        ? `${validItems.length} accesorio(s) agregado(s)` 
        : `${validItems.length} accessory(ies) added`);
      setItems([createEmptyItem()]);
      router.refresh();
    } catch (error: any) {
      console.error('Error adding accessories:', error);
      handleErrorSonner(
        error.response?.data?.error || (locale === 'es' ? 'Error al agregar accesorios' : 'Error adding accessories')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                {locale === 'es' ? 'Accesorio' : 'Accessory'} #{index + 1}
              </span>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('products.store')} *</span>
                <Select
                  value={item.storeId}
                  onValueChange={(value) =>
                    handleItemChange(index, 'storeId', value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600">
                    <SelectValue placeholder={locale === 'es' ? 'Seleccionar tienda' : 'Select store'} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {toTitleCase(store.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('common.category')} *</span>
                <Select
                  value={item.category}
                  onValueChange={(value) => {
                    handleItemChange(index, 'category', value);
                    handleItemChange(index, 'name', '');
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600">
                    <SelectValue placeholder={locale === 'es' ? 'Seleccionar categoría' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('common.name')} *</span>
                <Select
                  value={item.name}
                  onValueChange={(value) =>
                    handleItemChange(index, 'name', value)
                  }
                  disabled={!item.category}
                >
                  <SelectTrigger disabled={!item.category} className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600">
                    <SelectValue placeholder={!item.category ? (locale === 'es' ? "Seleccioná categoría primero" : "Select category first") : (locale === 'es' ? "Seleccionar tipo" : "Select type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {item.category && getVisibleTypes(item.category).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  {t('products.model')} {item.category === 'Fundas' ? '(Fundas)' : ''}
                </span>
                <Select
                  value={item.model}
                  onValueChange={(value) =>
                    handleItemChange(index, 'model', value)
                  }
                  disabled={item.category !== 'Fundas'}
                >
                  <SelectTrigger disabled={item.category !== 'Fundas'} className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600">
                    <SelectValue placeholder={item.category !== 'Fundas' ? "N/A" : (locale === 'es' ? "Seleccionar modelo iPhone" : "Select iPhone model")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(visibleModelGroups).map(([series, models]) => (
                      <SelectGroup key={series}>
                        <SelectLabel>{series}</SelectLabel>
                        {models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('common.quantity')}</span>
                <Input
                  type="number"
                  value={item.stock}
                  onChange={(e) =>
                    handleItemChange(index, 'stock', e.target.value)
                  }
                  placeholder="1"
                  className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600"
                />
              </Label>
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{locale === 'es' ? 'Precio venta' : 'Sale price'} *</span>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handleItemChange(index, 'price', e.target.value)
                  }
                  placeholder="$"
                  className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600"
                />
              </Label>
              <Label className="md:col-span-2">
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('common.description')}</span>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, 'description', e.target.value)
                  }
                  placeholder={t('common.optional')}
                  className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600"
                />
              </Label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleAddItem}>
          <PlusIcon className="h-4 w-4 mr-1" />
          {t('sales.addAnother')}
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {locale === 'es' ? 'Confirmar ingreso de accesorios' : 'Confirm accessory entry'}
        </Button>
      </div>
    </div>
  );
}
