import { useMemo } from 'react';
import { useHiddenModels } from './useHiddenModels';

// Lista COMPLETA de todos los modelos disponibles en el sistema
export const ALL_IPHONE_MODELS = [
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

// Modelos agrupados por serie
export const IPHONE_MODEL_GROUPS: Record<string, string[]> = {
  '17': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 17')),
  '16': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 16')),
  '15': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 15')),
  '14': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 14')),
  '13': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 13')),
  '12': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 12')),
  '11': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 11')),
  'X': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone X')),
  'SE': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone SE')),
  '8': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 8')),
  '7': ALL_IPHONE_MODELS.filter(m => m.startsWith('iPhone 7')),
};

// Accesorios agrupados por categoría (DEBE COINCIDIR CON ajustes/modelos/page.tsx)
export const ACCESSORY_GROUPS: Record<string, string[]> = {
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
export const ALL_ACCESSORIES = Object.values(ACCESSORY_GROUPS).flat();

/**
 * Hook que devuelve solo los modelos de iPhone VISIBLES según configuración
 */
export const useVisibleIPhoneModels = () => {
  const { hiddenModels } = useHiddenModels();
  
  const visibleModels = useMemo(() => {
    return ALL_IPHONE_MODELS.filter(model => !hiddenModels.includes(model));
  }, [hiddenModels]);

  const visibleModelGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    Object.entries(IPHONE_MODEL_GROUPS).forEach(([key, models]) => {
      const visible = models.filter(m => !hiddenModels.includes(m));
      if (visible.length > 0) {
        groups[key] = visible;
      }
    });
    return groups;
  }, [hiddenModels]);

  return {
    visibleModels,
    visibleModelGroups,
    allModels: ALL_IPHONE_MODELS,
  };
};

/**
 * Hook que devuelve solo los accesorios VISIBLES según configuración
 */
export const useVisibleAccessories = () => {
  const { hiddenAccessories } = useHiddenModels();
  
  const visibleAccessories = useMemo(() => {
    return ALL_ACCESSORIES.filter(acc => !hiddenAccessories.includes(acc));
  }, [hiddenAccessories]);

  const visibleAccessoryGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    Object.entries(ACCESSORY_GROUPS).forEach(([category, items]) => {
      const visible = items.filter(item => !hiddenAccessories.includes(item));
      if (visible.length > 0) {
        groups[category] = visible;
      }
    });
    return groups;
  }, [hiddenAccessories]);

  return {
    visibleAccessories,
    visibleAccessoryGroups,
    allAccessories: ALL_ACCESSORIES,
    allAccessoryGroups: ACCESSORY_GROUPS,
  };
};
