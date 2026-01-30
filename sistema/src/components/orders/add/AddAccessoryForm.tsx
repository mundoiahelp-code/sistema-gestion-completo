'use client';

import { useState } from 'react';
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
import { ACCESSORY_CATEGORIES } from '@/components/accessories/AccessoriesFilters';

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
          <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700">
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
                    {Object.keys(ACCESSORY_CATEGORIES).map((cat) => (
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
                    {item.category && ACCESSORY_CATEGORIES[item.category as keyof typeof ACCESSORY_CATEGORIES]?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('products.model')}</span>
                <Select
                  value={item.model}
                  onValueChange={(value) =>
                    handleItemChange(index, 'model', value)
                  }
                  disabled={item.category !== 'Fundas y Protección'}
                >
                  <SelectTrigger disabled={item.category !== 'Fundas y Protección'} className="bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600">
                    <SelectValue placeholder={item.category !== 'Fundas y Protección' ? "N/A" : (locale === 'es' ? "Seleccionar modelo" : "Select model")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>17</SelectLabel>
                      <SelectItem value="iPhone 17 Pro Max">iPhone 17 Pro Max</SelectItem>
                      <SelectItem value="iPhone 17 Pro">iPhone 17 Pro</SelectItem>
                      <SelectItem value="iPhone 17 Plus">iPhone 17 Plus</SelectItem>
                      <SelectItem value="iPhone 17">iPhone 17</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>16</SelectLabel>
                      <SelectItem value="iPhone 16 Pro Max">iPhone 16 Pro Max</SelectItem>
                      <SelectItem value="iPhone 16 Pro">iPhone 16 Pro</SelectItem>
                      <SelectItem value="iPhone 16 Plus">iPhone 16 Plus</SelectItem>
                      <SelectItem value="iPhone 16">iPhone 16</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>15</SelectLabel>
                      <SelectItem value="iPhone 15 Pro Max">iPhone 15 Pro Max</SelectItem>
                      <SelectItem value="iPhone 15 Pro">iPhone 15 Pro</SelectItem>
                      <SelectItem value="iPhone 15 Plus">iPhone 15 Plus</SelectItem>
                      <SelectItem value="iPhone 15">iPhone 15</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>14</SelectLabel>
                      <SelectItem value="iPhone 14 Pro Max">iPhone 14 Pro Max</SelectItem>
                      <SelectItem value="iPhone 14 Pro">iPhone 14 Pro</SelectItem>
                      <SelectItem value="iPhone 14 Plus">iPhone 14 Plus</SelectItem>
                      <SelectItem value="iPhone 14">iPhone 14</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>13</SelectLabel>
                      <SelectItem value="iPhone 13 Pro Max">iPhone 13 Pro Max</SelectItem>
                      <SelectItem value="iPhone 13 Pro">iPhone 13 Pro</SelectItem>
                      <SelectItem value="iPhone 13">iPhone 13</SelectItem>
                      <SelectItem value="iPhone 13 Mini">iPhone 13 Mini</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>12</SelectLabel>
                      <SelectItem value="iPhone 12 Pro Max">iPhone 12 Pro Max</SelectItem>
                      <SelectItem value="iPhone 12 Pro">iPhone 12 Pro</SelectItem>
                      <SelectItem value="iPhone 12">iPhone 12</SelectItem>
                      <SelectItem value="iPhone 12 Mini">iPhone 12 Mini</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>11</SelectLabel>
                      <SelectItem value="iPhone 11 Pro Max">iPhone 11 Pro Max</SelectItem>
                      <SelectItem value="iPhone 11 Pro">iPhone 11 Pro</SelectItem>
                      <SelectItem value="iPhone 11">iPhone 11</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>X</SelectLabel>
                      <SelectItem value="iPhone XS Max">iPhone XS Max</SelectItem>
                      <SelectItem value="iPhone XS">iPhone XS</SelectItem>
                      <SelectItem value="iPhone XR">iPhone XR</SelectItem>
                      <SelectItem value="iPhone X">iPhone X</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>SE</SelectLabel>
                      <SelectItem value="iPhone SE 3">iPhone SE 3</SelectItem>
                      <SelectItem value="iPhone SE 2">iPhone SE 2</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>8</SelectLabel>
                      <SelectItem value="iPhone 8 Plus">iPhone 8 Plus</SelectItem>
                      <SelectItem value="iPhone 8">iPhone 8</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>7</SelectLabel>
                      <SelectItem value="iPhone 7 Plus">iPhone 7 Plus</SelectItem>
                      <SelectItem value="iPhone 7">iPhone 7</SelectItem>
                    </SelectGroup>
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
