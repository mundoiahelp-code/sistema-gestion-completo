'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Camera, Plus, Trash2, Upload, ImageIcon, Loader2, Clock } from 'lucide-react';
import useSonner from '@/hooks/useSonner';
import { useTranslation } from '@/i18n/I18nProvider';

interface Photo {
  id: string;
  filename: string;
  url: string;
  order: number;
  createdAt: string;
}

interface PhotoModel {
  modelName: string;
  category: string;
  photos: Photo[];
}

// Modelos organizados por número
const IPHONE_MODELS: Record<string, string[]> = {
  '17': ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17 Air', 'iPhone 17'],
  '16': ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16'],
  '15': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'],
  '14': ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14'],
  '13': ['iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini'],
  '12': ['iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini'],
  '11': ['iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11'],
  'X': ['iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X'],
  'SE': ['iPhone SE 3', 'iPhone SE 2', 'iPhone SE'],
  '8': ['iPhone 8 Plus', 'iPhone 8'],
  '7': ['iPhone 7 Plus', 'iPhone 7'],
};

const ACCESSORY_MODELS: Record<string, string[]> = {
  'AirPods': ['AirPods Pro 2', 'AirPods Pro', 'AirPods 3', 'AirPods 2', 'AirPods Max'],
  'Apple Watch': ['Apple Watch Ultra 2', 'Apple Watch Series 9', 'Apple Watch SE'],
  'Cables / Adaptadores': ['MagSafe', 'Cargador 20W', 'Cargador 35W'],
  'Fundas': ['Funda Silicona', 'Funda Cuero', 'Funda Clear'],
};


// Calcular días restantes antes de que se borre (7 días desde creación)
const getDaysRemaining = (createdAt: string): number => {
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

export default function ProductPhotosSettings() {
  const { t } = useTranslation();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [models, setModels] = useState<PhotoModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelCategory, setNewModelCategory] = useState<'PHONE' | 'ACCESSORY' | ''>('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      const res = await axios.get(`${API}/product-photos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModels(res.data.models || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedModel) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('modelName', selectedModel);
      const model = models.find(m => m.modelName === selectedModel);
      formData.append('category', model?.category || 'PHONE');

      await axios.post(`${API}/product-photos`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      handleSuccessSonner(t('settings.productPhotos.photoUploaded'));
      fetchPhotos();
    } catch (error) {
      handleErrorSonner(t('settings.productPhotos.uploadError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      await axios.delete(`${API}/product-photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleSuccessSonner(t('settings.productPhotos.photoDeleted'));
      fetchPhotos();
    } catch (error) {
      handleErrorSonner(t('settings.productPhotos.deleteError'));
    }
  };

  const handleAddModel = () => {
    if (!newModelName.trim() || !newModelCategory) {
      handleErrorSonner(t('settings.productPhotos.selectCategoryAndModel'));
      return;
    }
    setModels([...models, { modelName: newModelName.trim(), category: newModelCategory, photos: [] }]);
    setNewModelName('');
    setNewModelCategory('');
    setShowAddModel(false);
    handleSuccessSonner(t('settings.productPhotos.modelAdded'));
  };

  const getAvailableModels = () => {
    const existingModels = models.map(m => m.modelName);
    if (newModelCategory === 'PHONE') {
      return Object.entries(IPHONE_MODELS).map(([series, phones]) => ({
        series,
        models: phones.filter(p => !existingModels.includes(p))
      })).filter(g => g.models.length > 0);
    } else if (newModelCategory === 'ACCESSORY') {
      return Object.entries(ACCESSORY_MODELS).map(([category, items]) => ({
        series: category,
        models: items.filter(i => !existingModels.includes(i))
      })).filter(g => g.models.length > 0);
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {t('settings.productPhotos.autoDeleteInfo')}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('settings.productPhotos.addModel')}
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Lista de modelos como Accordion */}
      {models.length > 0 ? (
        <Accordion type="multiple" className="space-y-2">
          {models.map((model) => (
            <AccordionItem 
              key={model.modelName} 
              value={model.modelName}
              className="border rounded-lg px-4 bg-white dark:bg-zinc-800"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{model.modelName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
                      {model.category === 'PHONE' ? '📱' : '🎧'} {model.photos.length} {t('settings.productPhotos.photo')}{model.photos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3">
                  {/* Botón subir */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedModel(model.modelName);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    {uploading && selectedModel === model.modelName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('settings.productPhotos.uploadPhoto')}
                      </>
                    )}
                  </Button>

                  {/* Grid de fotos con días restantes */}
                  {model.photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {model.photos.map((photo) => {
                        const daysLeft = getDaysRemaining(photo.createdAt);
                        return (
                          <div key={photo.id} className="relative group">
                            <img
                              src={`${API.replace('/api', '')}${photo.url}`}
                              alt={model.modelName}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            {/* Badge días restantes */}
                            <div className={`absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              daysLeft <= 2 ? 'bg-red-500 text-white' : 'bg-black/60 text-white'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {daysLeft}d
                            </div>
                            {/* Botón eliminar */}
                            <button
                              onClick={() => handleDelete(photo.id)}
                              className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 bg-gray-50 dark:bg-zinc-700 rounded-lg text-gray-400">
                      <ImageIcon className="h-5 w-5 mr-2" />
                      <span className="text-sm">{t('settings.productPhotos.noPhotos')}</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <Camera className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>{t('settings.productPhotos.noModels')}</p>
          <p className="text-sm">{t('settings.productPhotos.addModelToStart')}</p>
        </div>
      )}

      {/* Dialog agregar modelo */}
      <Dialog open={showAddModel} onOpenChange={(open) => {
        setShowAddModel(open);
        if (!open) { setNewModelCategory(''); setNewModelName(''); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.productPhotos.addModel')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t('settings.productPhotos.category')}</Label>
              <Select value={newModelCategory} onValueChange={(val: 'PHONE' | 'ACCESSORY') => {
                setNewModelCategory(val);
                setNewModelName('');
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('settings.productPhotos.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE">📱 iPhone</SelectItem>
                  <SelectItem value="ACCESSORY">🎧 {t('settings.productPhotos.accessory')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newModelCategory && (
              <div>
                <Label>{t('settings.productPhotos.model')}</Label>
                <Select value={newModelName} onValueChange={setNewModelName}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('settings.productPhotos.selectModel')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {getAvailableModels().map((group) => (
                      <SelectGroup key={group.series}>
                        <SelectLabel className="font-bold text-sm py-2 px-2">{group.series}</SelectLabel>
                        {group.models.map((m) => (
                          <SelectItem key={m} value={m} className="pl-4">{m}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModel(false); setNewModelCategory(''); setNewModelName(''); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddModel} disabled={!newModelName || !newModelCategory}>{t('common.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
