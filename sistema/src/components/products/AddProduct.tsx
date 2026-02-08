'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';

// Base de datos de modelos de iPhone organizados por serie
const IPHONE_MODELS = {
  '7': [
    {
      model: 'iPhone 7',
      storages: ['32GB', '128GB', '256GB'],
      colors: ['Negro', 'Negro Brillante', 'Plata', 'Oro', 'Oro Rosa', 'Rojo'],
    },
    {
      model: 'iPhone 7 Plus',
      storages: ['32GB', '128GB', '256GB'],
      colors: ['Negro', 'Negro Brillante', 'Plata', 'Oro', 'Oro Rosa', 'Rojo'],
    },
  ],
  '8': [
    {
      model: 'iPhone 8',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro', 'Rojo'],
    },
    {
      model: 'iPhone 8 Plus',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro', 'Rojo'],
    },
  ],
  'X': [
    {
      model: 'iPhone X',
      storages: ['64GB', '256GB'],
      colors: ['Gris Espacial', 'Plata'],
    },
    {
      model: 'iPhone XR',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Negro', 'Blanco', 'Azul', 'Amarillo', 'Coral', 'Rojo'],
    },
    {
      model: 'iPhone XS',
      storages: ['64GB', '256GB', '512GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro'],
    },
    {
      model: 'iPhone XS Max',
      storages: ['64GB', '256GB', '512GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro'],
    },
  ],
  'SE': [
    {
      model: 'iPhone SE',
      storages: ['16GB', '32GB', '64GB', '128GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro Rosa'],
    },
    {
      model: 'iPhone SE 2',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Negro', 'Blanco', 'Rojo'],
    },
    {
      model: 'iPhone SE 3',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Medianoche', 'Blanco Estelar', 'Rojo'],
    },
  ],
  '11': [
    {
      model: 'iPhone 11',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Negro', 'Blanco', 'Verde', 'Amarillo', 'Morado', 'Rojo'],
    },
    {
      model: 'iPhone 11 Pro',
      storages: ['64GB', '256GB', '512GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro', 'Verde Noche'],
    },
    {
      model: 'iPhone 11 Pro Max',
      storages: ['64GB', '256GB', '512GB'],
      colors: ['Gris Espacial', 'Plata', 'Oro', 'Verde Noche'],
    },
  ],
  '12': [
    {
      model: 'iPhone 12 Mini',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Negro', 'Blanco', 'Rojo', 'Verde', 'Azul', 'Morado'],
    },
    {
      model: 'iPhone 12',
      storages: ['64GB', '128GB', '256GB'],
      colors: ['Negro', 'Blanco', 'Rojo', 'Verde', 'Azul', 'Morado'],
    },
    {
      model: 'iPhone 12 Pro',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Grafito', 'Plata', 'Oro', 'Azul Pacífico'],
    },
    {
      model: 'iPhone 12 Pro Max',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Grafito', 'Plata', 'Oro', 'Azul Pacífico'],
    },
  ],
  '13': [
    {
      model: 'iPhone 13 Mini',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Rosa', 'Azul', 'Medianoche', 'Blanco Estelar', 'Rojo', 'Verde'],
    },
    {
      model: 'iPhone 13',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Rosa', 'Azul', 'Medianoche', 'Blanco Estelar', 'Rojo', 'Verde'],
    },
    {
      model: 'iPhone 13 Pro',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Grafito', 'Oro', 'Plata', 'Azul Sierra', 'Verde Alpino'],
    },
    {
      model: 'iPhone 13 Pro Max',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Grafito', 'Oro', 'Plata', 'Azul Sierra', 'Verde Alpino'],
    },
  ],
  '14': [
    {
      model: 'iPhone 14',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Medianoche', 'Blanco Estelar', 'Rojo', 'Azul', 'Morado', 'Amarillo'],
    },
    {
      model: 'iPhone 14 Plus',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Medianoche', 'Blanco Estelar', 'Rojo', 'Azul', 'Morado', 'Amarillo'],
    },
    {
      model: 'iPhone 14 Pro',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Morado Oscuro', 'Oro', 'Plata', 'Negro Espacial'],
    },
    {
      model: 'iPhone 14 Pro Max',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Morado Oscuro', 'Oro', 'Plata', 'Negro Espacial'],
    },
  ],
  '15': [
    {
      model: 'iPhone 15',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Negro', 'Azul', 'Verde', 'Amarillo', 'Rosa'],
    },
    {
      model: 'iPhone 15 Plus',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Negro', 'Azul', 'Verde', 'Amarillo', 'Rosa'],
    },
    {
      model: 'iPhone 15 Pro',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Gris', 'Azul', 'Blanco', 'Negro'],
    },
    {
      model: 'iPhone 15 Pro Max',
      storages: ['256GB', '512GB', '1TB'],
      colors: ['Gris', 'Azul', 'Blanco', 'Negro'],
    },
  ],
  '16': [
    {
      model: 'iPhone 16',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'],
    },
    {
      model: 'iPhone 16 Plus',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'],
    },
    {
      model: 'iPhone 16 Pro',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Negro', 'Gris', 'Blanco', 'Dorado'],
    },
    {
      model: 'iPhone 16 Pro Max',
      storages: ['256GB', '512GB', '1TB'],
      colors: ['Negro', 'Gris', 'Blanco', 'Dorado'],
    },
  ],
  '17': [
    {
      model: 'iPhone 17',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'],
    },
    {
      model: 'iPhone 17 Air',
      storages: ['128GB', '256GB', '512GB'],
      colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'],
    },
    {
      model: 'iPhone 17 Pro',
      storages: ['128GB', '256GB', '512GB', '1TB'],
      colors: ['Negro', 'Gris', 'Blanco', 'Dorado'],
    },
    {
      model: 'iPhone 17 Pro Max',
      storages: ['256GB', '512GB', '1TB', '2TB'],
      colors: ['Negro', 'Gris', 'Blanco', 'Dorado'],
    },
  ],
};

export default function AddProduct() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const router = useRouter();

  const [selectedSeries, setSelectedSeries] = useState('');
  const [availableStorages, setAvailableStorages] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [searchingImei, setSearchingImei] = useState(false);

  // Cargar tiendas al abrir el modal
  useEffect(() => {
    if (open && stores.length === 0) {
      const token = Cookies.get('token');
      axios.get(`${API}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          let storesList = res.data.stores || res.data || [];
          // Eliminar duplicados por ID
          const uniqueStores = Array.from(
            new Map(storesList.map((store: any) => [store.id, store])).values()
          ) as { id: string; name: string }[];
          console.log('Stores loaded:', uniqueStores);
          setStores(uniqueStores);
          if (uniqueStores.length > 0) {
            setSelectedStore(uniqueStores[0].id);
          }
        })
        .catch((err) => console.error('Error loading stores:', err));
    }
  }, [open, stores.length]);

  const [formData, setFormData] = useState({
    name: 'iPhone',
    model: '',
    storage: '',
    color: '',
    imei: '',
    battery: '',
    price: '',
    cost: '',
    stock: '1',
    condition: 'Nuevo',
    description: '',
  });

  const handleModelChange = (model: string) => {
    setFormData({ ...formData, model, storage: '', color: '' });
    
    // Encontrar el modelo en todas las series
    for (const [series, models] of Object.entries(IPHONE_MODELS)) {
      const foundModel = models.find(m => m.model === model);
      if (foundModel) {
        setSelectedSeries(series);
        setAvailableStorages(foundModel.storages);
        setAvailableColors(foundModel.colors);
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = Cookies.get('token');
    
    if (!token) {
      alert(t('addProduct.noSession'));
      setLoading(false);
      return;
    }

    if (!selectedStore) {
      alert(t('addProduct.selectStore'));
      setLoading(false);
      return;
    }
    
    try {
      await axios.post(`${API}/products`, {
        name: formData.model || 'iPhone',
        model: formData.model,
        storage: formData.storage,
        color: formData.color,
        imei: formData.imei || undefined,
        battery: formData.battery ? parseInt(formData.battery) : undefined,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined, // Opcional
        stock: parseInt(formData.stock),
        condition: formData.condition,
        category: 'PHONE',
        description: formData.description || undefined,
        storeId: selectedStore,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOpen(false);
      setFormData({
        name: '',
        model: '',
        storage: '',
        color: '',
        imei: '',
        battery: '',
        price: '',
        cost: '',
        stock: '1',
        condition: 'Nuevo',
        description: '',
      });
      router.refresh();
    } catch (error) {
      console.error('Error creating product:', error);
      alert(t('addProduct.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('addProduct.addProduct')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addProduct.newProduct')}</DialogTitle>
          <DialogDescription>
            {t('addProduct.fillData')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {stores.length > 1 && (
              <div className="col-span-2">
                <Label>{t('addProduct.store')} *</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('addProduct.selectStorePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores && stores.length > 0 ? stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-stores" disabled>
                        No hay sucursales disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2">
              <Label>{t('addProduct.model')} *</Label>
              <Select value={formData.model} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('addProduct.selectModel')} />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {Object.entries(IPHONE_MODELS).map(([series, models]) => (
                    <SelectGroup key={series}>
                      <SelectLabel>iPhone {series}</SelectLabel>
                      {models.map((item) => (
                        <SelectItem key={item.model} value={item.model}>
                          {item.model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('addProduct.storage')} *</Label>
              <Select 
                value={formData.storage} 
                onValueChange={(value) => setFormData({ ...formData, storage: value })}
                disabled={!formData.model}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.model ? t('common.select') : t('addProduct.selectModelFirst')} />
                </SelectTrigger>
                <SelectContent>
                  {availableStorages.map((storage) => (
                    <SelectItem key={storage} value={storage}>
                      {storage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('addProduct.color')} *</Label>
              <Select 
                value={formData.color} 
                onValueChange={(value) => setFormData({ ...formData, color: value })}
                disabled={!formData.model}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.model ? t('common.select') : t('addProduct.selectModelFirst')} />
                </SelectTrigger>
                <SelectContent>
                  {availableColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>IMEI</Label>
              <Input
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('addProduct.battery')} (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.battery}
                onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                placeholder="85"
              />
            </div>
            <div>
              <Label>{t('addProduct.condition')} *</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nuevo">{t('addProduct.conditions.new')}</SelectItem>
                  <SelectItem value="Usado">{t('addProduct.conditions.used')}</SelectItem>
                  <SelectItem value="Reacondicionado">{t('addProduct.conditions.refurbished')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('addProduct.price')} *</Label>
              <Input
                required
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('addProduct.cost')} (opcional)</Label>
              <Input
                type="number"
                placeholder="Costo de compra"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('addProduct.stock')} *</Label>
              <Input
                required
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{t('addProduct.description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('addProduct.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
