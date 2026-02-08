'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';

interface Accessory {
  id: string;
  name: string;
  model: string;
  price: number;
  cost: number;
  stock: number;
  store?: { name: string };
}

interface Props {
  onAddAccessory: (accessory: Accessory, quantity: number) => void;
  loading: boolean;
}

export default function AccessorySearch({ onAddAccessory, loading }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [searching, setSearching] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const handleSearch = async () => {
    if (search.length < 2) return;
    
    setSearching(true);
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/products?search=${search}&category=ACCESSORY`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const products = res.data.products || [];
      setAccessories(products);
      
      // Inicializar cantidades
      const initQty: { [key: string]: number } = {};
      products.forEach((p: Accessory) => {
        initQty[p.id] = 1;
      });
      setQuantities(initQty);
    } catch (err) {
      console.error('Error searching accessories:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const handleAdd = (accessory: Accessory) => {
    onAddAccessory(accessory, quantities[accessory.id] || 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('products.searchAccessory')}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          variant="outline" 
          onClick={handleSearch}
          disabled={searching || search.length < 2}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {accessories.length > 0 && (
        <div className="rounded-lg divide-y max-h-48 overflow-y-auto bg-zinc-50 dark:bg-zinc-800/50">
          {accessories.map((acc) => (
            <div key={acc.id} className="p-2 flex items-center justify-between gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{acc.name}</p>
                <p className="text-xs text-gray-500">
                  {acc.model && `${acc.model} • `}{acc.store?.name} • {t('products.stock')}: {acc.stock}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-medium whitespace-nowrap">
                  ${acc.price}
                </span>
                <div className="flex items-center border rounded">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleQuantityChange(acc.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{quantities[acc.id] || 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleQuantityChange(acc.id, 1)}
                    disabled={(quantities[acc.id] || 1) >= acc.stock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAdd(acc)}
                  disabled={loading || acc.stock < 1}
                  className="h-7"
                >
                  {t('common.add')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
