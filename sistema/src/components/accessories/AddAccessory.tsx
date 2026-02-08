'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { PlusIcon, PlusCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';
import useSonner from '@/hooks/useSonner';

// Categorías de accesorios predefinidas
const ACCESSORY_CATEGORIES = {
  'Fundas': [
    { name: 'Funda Silicona', models: ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'] },
    { name: 'Funda MagSafe', models: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'] },
    { name: 'Funda Transparente', models: ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'] },
    { name: 'Funda Cuero', models: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'] },
  ],
  'Cables / Adaptadores': [
    { name: 'Cargador MagSafe', models: ['15W', '7.5W'] },
    { name: 'Cargador USB-C', models: ['20W', '30W', '35W', '67W', '96W', '140W'] },
    { name: 'Cargador Inalámbrico', models: ['Genérico', 'Duo', 'Stand'] },
    { name: 'Cargador Auto', models: ['USB-C', 'MagSafe'] },
  ],
  'Cables': [
    { name: 'Cable USB-C a Lightning', models: ['1m', '2m'] },
    { name: 'Cable USB-C a USB-C', models: ['1m', '2m'] },
    { name: 'Cable USB-A a Lightning', models: ['1m', '2m'] },
  ],
  'Audio': [
    { name: 'AirPods', models: ['2da Gen', '3ra Gen', '4ta Gen', '4ta Gen ANC'] },
    { name: 'AirPods Pro', models: ['1ra Gen', '2da Gen', '2da Gen USB-C'] },
    { name: 'AirPods Max', models: ['Lightning', 'USB-C'] },
    { name: 'EarPods', models: ['Lightning', 'USB-C', '3.5mm'] },
  ],
  'Protectores': [
    { name: 'Vidrio Templado', models: ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'] },
    { name: 'Protector Cámara', models: ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'] },
    { name: 'Hidrogel', models: ['Frontal', 'Trasero', 'Full'] },
  ],
  'Apple Watch': [
    { name: 'Correa Deportiva', models: ['38/40/41mm', '42/44/45/49mm'] },
    { name: 'Correa Milanesa', models: ['38/40/41mm', '42/44/45/49mm'] },
    { name: 'Correa Cuero', models: ['38/40/41mm', '42/44/45/49mm'] },
    { name: 'Cargador Apple Watch', models: ['USB-C', 'USB-A'] },
  ],
  'Otros': [
    { name: 'AirTag', models: ['Unidad', 'Pack 4'] },
    { name: 'Apple Pencil', models: ['1ra Gen', '2da Gen', 'USB-C', 'Pro'] },
    { name: 'Magic Keyboard', models: ['iPad', 'Mac'] },
    { name: 'Adaptador', models: ['Lightning a 3.5mm', 'USB-C a 3.5mm', 'USB-C a USB-A'] },
  ],
};

// Función para obtener productos ocultos
const getHiddenAccessories = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('hiddenAccessories') || '[]');
  } catch {
    return [];
  }
};

// Función para filtrar productos visibles de una categoría
const getVisibleProducts = (category: string): { name: string; models: string[] }[] => {
  const products = ACCESSORY_CATEGORIES[category as keyof typeof ACCESSORY_CATEGORIES] || [];
  const hidden = getHiddenAccessories();
  return products.filter(p => !hidden.includes(p.name));
};

// Función para obtener categorías que tienen al menos un producto visible
const getVisibleCategories = (): string[] => {
  const hidden = getHiddenAccessories();
  return Object.keys(ACCESSORY_CATEGORIES).filter(cat => {
    const products = ACCESSORY_CATEGORIES[cat as keyof typeof ACCESSORY_CATEGORIES];
    return products.some(p => !hidden.includes(p.name));
  });
};

export default function AddAccessory() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const router = useRouter();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableProducts, setAvailableProducts] = useState<{ name: string; models: string[] }[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [customName, setCustomName] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);

  // Cargar categorías visibles al montar
  useEffect(() => {
    setVisibleCategories(getVisibleCategories());
    
    // Escuchar cambios en productos ocultos
    const handleUpdate = () => {
      setVisibleCategories(getVisibleCategories());
      // Si hay una categoría seleccionada, actualizar los productos disponibles
      if (selectedCategory) {
        setAvailableProducts(getVisibleProducts(selectedCategory));
      }
    };
    window.addEventListener('hiddenAccessoriesUpdated', handleUpdate);
    return () => window.removeEventListener('hiddenAccessoriesUpdated', handleUpdate);
  }, [selectedCategory]);

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    price: '',
    cost: '',
    stock: '1',
  });

  useEffect(() => {
    if (open && stores.length === 0) {
      const token = Cookies.get('accessToken');
      axios.get(`${API}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          const storesList = res.data.stores || res.data || [];
          const uniqueStores = Array.from(
            new Map(storesList.map((store: any) => [store.id, store])).values()
          ) as { id: string; name: string }[];
          setStores(uniqueStores);
          if (uniqueStores.length > 0) {
            setSelectedStore(uniqueStores[0].id);
          }
        })
        .catch((err) => console.error('Error loading stores:', err));
    }
  }, [open, stores.length]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const products = getVisibleProducts(category);
    setAvailableProducts(products);
    setAvailableModels([]);
    setFormData({ ...formData, name: '', model: '' });
    setCustomName(false);
  };

  const handleProductChange = (productName: string) => {
    const product = availableProducts.find(p => p.name === productName);
    setFormData({ ...formData, name: productName, model: '' });
    setAvailableModels(product?.models || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.cost) {
      handleErrorSonner(t('errors.validation'));
      return;
    }

    setLoading(true);
    const token = Cookies.get('accessToken');
    
    if (!selectedStore) {
      handleErrorSonner(t('addAccessory.noStores'));
      setLoading(false);
      return;
    }
    
    try {
      const fullName = formData.model ? `${formData.name} ${formData.model}` : formData.name;
      
      await axios.post(`${API}/products`, {
        name: fullName,
        model: formData.model || selectedCategory || 'Accesorio',
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        condition: 'Nuevo',
        category: 'ACCESSORY',
        storeId: selectedStore,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleSuccessSonner(t('notifications.created'));
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error creating accessory:', error);
      handleErrorSonner(t('addAccessory.createError'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', model: '', price: '', cost: '', stock: '1' });
    setSelectedCategory('');
    setAvailableProducts([]);
    setAvailableModels([]);
    setCustomName(false);
  };

  // Agregar rápido y seguir agregando
  const handleAddAndContinue = async () => {
    if (!formData.name || !formData.price || !formData.cost) {
      handleErrorSonner(t('errors.validation'));
      return;
    }

    setLoading(true);
    const token = Cookies.get('accessToken');
    
    try {
      const fullName = formData.model ? `${formData.name} ${formData.model}` : formData.name;
      
      await axios.post(`${API}/products`, {
        name: fullName,
        model: formData.model || selectedCategory || 'Accesorio',
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        condition: 'Nuevo',
        category: 'ACCESSORY',
        storeId: selectedStore,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleSuccessSonner(`✓ ${formData.name} ${formData.model || ''}`);
      // Mantener categoría y precios, limpiar solo nombre y modelo
      setFormData({ ...formData, name: '', model: '' });
      setAvailableModels([]);
      router.refresh();
    } catch (error) {
      handleErrorSonner(t('addAccessory.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('addAccessory.addAccessory')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('addAccessory.newAccessory')}</DialogTitle>
          <DialogDescription>{t('addAccessory.addToInventory')}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {stores.length > 1 && (
            <div>
              <Label>{t('addProduct.store')}</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!customName ? (
            <>
              <div>
                <Label>{t('common.category')}</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('addAccessory.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableProducts.length > 0 && (
                <div>
                  <Label>{t('addAccessory.product')}</Label>
                  <Select value={formData.name} onValueChange={handleProductChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('addAccessory.selectProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.name} value={product.name}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {availableModels.length > 0 && (
                <div>
                  <Label>{t('addAccessory.model')}</Label>
                  <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('addAccessory.selectModel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCustomName(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('addAccessory.customName')}
              </button>
            </>
          ) : (
            <>
              <div>
                <Label>{t('addAccessory.name')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('addAccessory.namePlaceholder')}
                />
              </div>
              <div>
                <Label>{t('addAccessory.model')}</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder={t('addAccessory.modelPlaceholder')}
                />
              </div>
              <button
                type="button"
                onClick={() => { setCustomName(false); setFormData({ ...formData, name: '', model: '' }); }}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('addAccessory.useCategories')}
              </button>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t('addAccessory.price')} *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t('addAccessory.cost')} *</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t('addAccessory.stock')}</Label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAndContinue}
              disabled={loading || !formData.name || !formData.price || !formData.cost}
              className="flex-1"
            >
              <PlusCircleIcon className="w-4 h-4 mr-1" />
              {t('addAccessory.addAnother')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('addAccessory.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
