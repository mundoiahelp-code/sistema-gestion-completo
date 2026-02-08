'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Loader2, Eye, EyeOff, Smartphone, Search, Package } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/I18nProvider';

const API = process.env.NEXT_PUBLIC_API_URL;

// Lista de todos los modelos de iPhone
const allModels = [
  'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17 Air', 'iPhone 17',
  'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
  'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
  'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
  'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
  'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
  'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
  'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
  'iPhone SE 3', 'iPhone SE 2', 'iPhone SE',
  'iPhone 8 Plus', 'iPhone 8',
  'iPhone 7 Plus', 'iPhone 7',
];

const modelGroups: { [key: string]: string[] } = {
  'iPhone 17': allModels.filter(m => m.startsWith('iPhone 17')),
  'iPhone 16': allModels.filter(m => m.startsWith('iPhone 16')),
  'iPhone 15': allModels.filter(m => m.startsWith('iPhone 15')),
  'iPhone 14': allModels.filter(m => m.startsWith('iPhone 14')),
  'iPhone 13': allModels.filter(m => m.startsWith('iPhone 13')),
  'iPhone 12': allModels.filter(m => m.startsWith('iPhone 12')),
  'iPhone 11': allModels.filter(m => m.startsWith('iPhone 11')),
  'iPhone X': allModels.filter(m => m.startsWith('iPhone X')),
  'iPhone SE': allModels.filter(m => m.startsWith('iPhone SE')),
  'iPhone 8': allModels.filter(m => m.startsWith('iPhone 8')),
  'iPhone 7': allModels.filter(m => m.startsWith('iPhone 7')),
};

// Productos de accesorios agrupados por categoría
const accessoryGroups: { [key: string]: string[] } = {
  'Fundas': [
    'Funda Silicona',
    'Funda MagSafe',
    'Funda Transparente',
    'Funda Cuero',
  ],
  'Cables / Adaptadores': [
    'Cargador MagSafe',
    'Cargador USB-C 20W',
    'Cargador USB-C 30W',
    'Cargador USB-C 35W',
    'Cargador USB-C 67W',
    'Cargador USB-C 96W',
    'Cargador USB-C 140W',
    'Cargador Inalámbrico',
    'Cargador Auto',
  ],
  'Cables': [
    'Cable USB-C a Lightning',
    'Cable USB-C a USB-C',
    'Cable USB-A a Lightning',
  ],
  'Audio': [
    'AirPods 2da Gen',
    'AirPods 3ra Gen',
    'AirPods 4ta Gen',
    'AirPods 4ta Gen ANC',
    'AirPods Pro 1ra Gen',
    'AirPods Pro 2da Gen',
    'AirPods Max',
    'EarPods Lightning',
    'EarPods USB-C',
    'EarPods 3.5mm',
  ],
  'Protectores': [
    'Vidrio Templado',
    'Protector Cámara',
    'Hidrogel Frontal',
    'Hidrogel Trasero',
    'Hidrogel Full',
  ],
  'Apple Watch': [
    'Correa Deportiva',
    'Correa Milanesa',
    'Correa Cuero',
    'Cargador Apple Watch',
  ],
  'Otros': [
    'AirTag',
    'Apple Pencil 1ra Gen',
    'Apple Pencil 2da Gen',
    'Apple Pencil USB-C',
    'Apple Pencil Pro',
    'Magic Keyboard iPad',
    'Magic Keyboard Mac',
    'Adaptador Lightning a 3.5mm',
    'Adaptador USB-C a 3.5mm',
    'Adaptador USB-C a USB-A',
  ],
};

// Lista plana de todos los accesorios
const allAccessories = Object.values(accessoryGroups).flat();

export default function ModelosPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hiddenModels, setHiddenModels] = useState<string[]>([]);
  const [hiddenAccessories, setHiddenAccessories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('iphones');

  const isEnglish = locale === 'en';

  useEffect(() => {
    loadConfig();
  }, []);

  const getToken = () => Cookies.get('accessToken') || Cookies.get('token');

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API}/tenants/current`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tenant?.hiddenModels) {
          try {
            setHiddenModels(JSON.parse(data.tenant.hiddenModels));
          } catch {
            setHiddenModels([]);
          }
        }
        if (data.tenant?.hiddenCategories) {
          try {
            setHiddenAccessories(JSON.parse(data.tenant.hiddenCategories));
          } catch {
            setHiddenAccessories([]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModels = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/tenants/current/hidden-models`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ hiddenModels })
      });

      if (res.ok) {
        toast.success(isEnglish ? 'Settings saved' : 'Configuración guardada');
        localStorage.setItem('hiddenModels', JSON.stringify(hiddenModels));
        window.dispatchEvent(new Event('hiddenModelsUpdated'));
      } else {
        toast.error(isEnglish ? 'Error saving' : 'Error al guardar');
      }
    } catch {
      toast.error(isEnglish ? 'Error saving' : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccessories = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/tenants/current/hidden-categories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ hiddenCategories: hiddenAccessories })
      });

      if (res.ok) {
        toast.success(isEnglish ? 'Settings saved' : 'Configuración guardada');
        localStorage.setItem('hiddenAccessories', JSON.stringify(hiddenAccessories));
        window.dispatchEvent(new Event('hiddenAccessoriesUpdated'));
      } else {
        toast.error(isEnglish ? 'Error saving' : 'Error al guardar');
      }
    } catch {
      toast.error(isEnglish ? 'Error saving' : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleModel = (model: string) => {
    setHiddenModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  const toggleGroup = (group: string) => {
    const groupModels = modelGroups[group];
    const allHidden = groupModels.every(m => hiddenModels.includes(m));
    
    if (allHidden) {
      setHiddenModels(prev => prev.filter(m => !groupModels.includes(m)));
    } else {
      setHiddenModels(prev => [...Array.from(new Set([...prev, ...groupModels]))]);
    }
  };

  const toggleAccessory = (accessory: string) => {
    setHiddenAccessories(prev =>
      prev.includes(accessory)
        ? prev.filter(a => a !== accessory)
        : [...prev, accessory]
    );
  };

  const toggleAccessoryGroup = (group: string) => {
    const groupItems = accessoryGroups[group];
    const allHidden = groupItems.every(a => hiddenAccessories.includes(a));
    
    if (allHidden) {
      setHiddenAccessories(prev => prev.filter(a => !groupItems.includes(a)));
    } else {
      setHiddenAccessories(prev => [...Array.from(new Set([...prev, ...groupItems]))]);
    }
  };

  const filteredGroups = Object.entries(modelGroups).filter(([group, models]) =>
    group.toLowerCase().includes(searchTerm.toLowerCase()) ||
    models.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAccessoryGroups = Object.entries(accessoryGroups).filter(([group, items]) =>
    group.toLowerCase().includes(searchTerm.toLowerCase()) ||
    items.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {isEnglish ? 'Visible Products' : 'Productos Visibles'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEnglish 
            ? 'Hide models or products you don\'t sell from filters and lists'
            : 'Ocultá los modelos o productos que no vendés de los filtros y listas'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); }}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="iphones" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            iPhones
          </TabsTrigger>
          <TabsTrigger value="accessories" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {isEnglish ? 'Accessories' : 'Accesorios'}
          </TabsTrigger>
        </TabsList>

        {/* Tab iPhones */}
        <TabsContent value="iphones" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isEnglish ? 'Search models...' : 'Buscar modelos...'}
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveModels} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEnglish ? 'Save Changes' : 'Guardar Cambios'}
            </Button>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              {allModels.length - hiddenModels.filter(m => allModels.includes(m)).length} {isEnglish ? 'visible' : 'visibles'}
            </span>
            <span className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-red-500" />
              {hiddenModels.filter(m => allModels.includes(m)).length} {isEnglish ? 'hidden' : 'ocultos'}
            </span>
          </div>

          <div className="space-y-4">
            {filteredGroups.map(([group, models]) => {
              const visibleCount = models.filter(m => !hiddenModels.includes(m)).length;
              const allHidden = visibleCount === 0;
              const someHidden = visibleCount > 0 && visibleCount < models.length;

              return (
                <Card key={group} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`group-${group}`}
                        checked={!allHidden}
                        onCheckedChange={() => toggleGroup(group)}
                        className={someHidden ? 'opacity-50' : ''}
                      />
                      <Label htmlFor={`group-${group}`} className="font-medium cursor-pointer">
                        {group}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {visibleCount}/{models.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pl-7">
                    {models.map(model => {
                      const isHidden = hiddenModels.includes(model);
                      return (
                        <div
                          key={model}
                          onClick={() => toggleModel(model)}
                          className={`
                            flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
                            ${isHidden 
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through opacity-60' 
                              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }
                          `}
                        >
                          {isHidden ? (
                            <EyeOff className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <Eye className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{model.replace('iPhone ', '')}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab Accesorios */}
        <TabsContent value="accessories" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isEnglish ? 'Search products...' : 'Buscar productos...'}
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveAccessories} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEnglish ? 'Save Changes' : 'Guardar Cambios'}
            </Button>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              {allAccessories.length - hiddenAccessories.filter(a => allAccessories.includes(a)).length} {isEnglish ? 'visible' : 'visibles'}
            </span>
            <span className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-red-500" />
              {hiddenAccessories.filter(a => allAccessories.includes(a)).length} {isEnglish ? 'hidden' : 'ocultos'}
            </span>
          </div>

          <div className="space-y-4">
            {filteredAccessoryGroups.map(([group, items]) => {
              const visibleCount = items.filter(i => !hiddenAccessories.includes(i)).length;
              const allHidden = visibleCount === 0;
              const someHidden = visibleCount > 0 && visibleCount < items.length;

              return (
                <Card key={group} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`acc-group-${group}`}
                        checked={!allHidden}
                        onCheckedChange={() => toggleAccessoryGroup(group)}
                        className={someHidden ? 'opacity-50' : ''}
                      />
                      <Label htmlFor={`acc-group-${group}`} className="font-medium cursor-pointer">
                        {group}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {visibleCount}/{items.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pl-7">
                    {items.map(item => {
                      const isHidden = hiddenAccessories.includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => toggleAccessory(item)}
                          className={`
                            flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
                            ${isHidden 
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through opacity-60' 
                              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }
                          `}
                        >
                          {isHidden ? (
                            <EyeOff className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <Eye className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
