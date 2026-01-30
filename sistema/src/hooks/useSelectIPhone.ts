import { useState, useMemo } from 'react';
import useField from './useField';

// Lista estática de modelos de iPhone con sus colores y capacidades
const iphoneModels: {
  model: string;
  colors: string[];
  storages: string[];
}[] = [
  // iPhone 17 Series (2025)
  { model: 'iPhone 17 Pro Max', colors: ['Gris', 'Negro', 'Blanco', 'Dorado'], storages: ['256gb', '512gb', '1tb', '2tb'] },
  { model: 'iPhone 17 Pro', colors: ['Gris', 'Negro', 'Blanco', 'Dorado'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 17 Air', colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 17', colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'], storages: ['128gb', '256gb', '512gb'] },
  // iPhone 16 Series (2024)
  { model: 'iPhone 16 Pro Max', colors: ['Gris', 'Negro', 'Blanco', 'Dorado'], storages: ['256gb', '512gb', '1tb'] },
  { model: 'iPhone 16 Pro', colors: ['Gris', 'Negro', 'Blanco', 'Dorado'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 16 Plus', colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 16', colors: ['Negro', 'Blanco', 'Rosa', 'Celeste', 'Azul'], storages: ['128gb', '256gb', '512gb'] },
  // iPhone 15 Series (2023)
  { model: 'iPhone 15 Pro Max', colors: ['Gris', 'Azul', 'Blanco', 'Negro'], storages: ['256gb', '512gb', '1tb'] },
  { model: 'iPhone 15 Pro', colors: ['Gris', 'Azul', 'Blanco', 'Negro'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 15 Plus', colors: ['Negro', 'Azul', 'Verde', 'Amarillo', 'Rosa'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 15', colors: ['Negro', 'Azul', 'Verde', 'Amarillo', 'Rosa'], storages: ['128gb', '256gb', '512gb'] },
  // iPhone 14 Series
  { model: 'iPhone 14 Pro Max', colors: ['Negro Espacial', 'Plata', 'Oro', 'Morado Oscuro'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 14 Pro', colors: ['Negro Espacial', 'Plata', 'Oro', 'Morado Oscuro'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 14 Plus', colors: ['Medianoche', 'Blanco Estelar', 'Azul', 'Morado', 'Amarillo', 'Rojo'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 14', colors: ['Medianoche', 'Blanco Estelar', 'Azul', 'Morado', 'Amarillo', 'Rojo'], storages: ['128gb', '256gb', '512gb'] },
  // iPhone 13 Series
  { model: 'iPhone 13 Pro Max', colors: ['Grafito', 'Oro', 'Plata', 'Azul Sierra', 'Verde Alpino'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 13 Pro', colors: ['Grafito', 'Oro', 'Plata', 'Azul Sierra', 'Verde Alpino'], storages: ['128gb', '256gb', '512gb', '1tb'] },
  { model: 'iPhone 13', colors: ['Medianoche', 'Blanco Estelar', 'Azul', 'Rosa', 'Rojo', 'Verde'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 13 Mini', colors: ['Medianoche', 'Blanco Estelar', 'Azul', 'Rosa', 'Rojo', 'Verde'], storages: ['128gb', '256gb', '512gb'] },
  // iPhone 12 Series
  { model: 'iPhone 12 Pro Max', colors: ['Grafito', 'Oro', 'Plata', 'Azul Pacífico'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 12 Pro', colors: ['Grafito', 'Oro', 'Plata', 'Azul Pacífico'], storages: ['128gb', '256gb', '512gb'] },
  { model: 'iPhone 12', colors: ['Negro', 'Blanco', 'Azul', 'Verde', 'Rojo', 'Morado'], storages: ['64gb', '128gb', '256gb'] },
  { model: 'iPhone 12 Mini', colors: ['Negro', 'Blanco', 'Azul', 'Verde', 'Rojo', 'Morado'], storages: ['64gb', '128gb', '256gb'] },
  // iPhone 11 Series
  { model: 'iPhone 11 Pro Max', colors: ['Gris Espacial', 'Plata', 'Oro', 'Verde Noche'], storages: ['64gb', '256gb', '512gb'] },
  { model: 'iPhone 11 Pro', colors: ['Gris Espacial', 'Plata', 'Oro', 'Verde Noche'], storages: ['64gb', '256gb', '512gb'] },
  { model: 'iPhone 11', colors: ['Negro', 'Blanco', 'Amarillo', 'Verde', 'Morado', 'Rojo'], storages: ['64gb', '128gb', '256gb'] },
  // iPhone X Series
  { model: 'iPhone XS Max', colors: ['Gris Espacial', 'Plata', 'Oro'], storages: ['64gb', '256gb', '512gb'] },
  { model: 'iPhone XS', colors: ['Gris Espacial', 'Plata', 'Oro'], storages: ['64gb', '256gb', '512gb'] },
  { model: 'iPhone XR', colors: ['Negro', 'Blanco', 'Azul', 'Amarillo', 'Coral', 'Rojo'], storages: ['64gb', '128gb', '256gb'] },
  { model: 'iPhone X', colors: ['Gris Espacial', 'Plata'], storages: ['64gb', '256gb'] },
  // iPhone SE
  { model: 'iPhone SE 3', colors: ['Medianoche', 'Blanco Estelar', 'Rojo'], storages: ['64gb', '128gb', '256gb'] },
  { model: 'iPhone SE 2', colors: ['Negro', 'Blanco', 'Rojo'], storages: ['64gb', '128gb', '256gb'] },
  { model: 'iPhone SE', colors: ['Gris Espacial', 'Plata', 'Oro Rosa'], storages: ['16gb', '32gb', '64gb', '128gb'] },
  // iPhone 8 Series
  { model: 'iPhone 8 Plus', colors: ['Gris Espacial', 'Plata', 'Oro', 'Rojo'], storages: ['64gb', '128gb', '256gb'] },
  { model: 'iPhone 8', colors: ['Gris Espacial', 'Plata', 'Oro', 'Rojo'], storages: ['64gb', '128gb', '256gb'] },
  // iPhone 7 Series
  { model: 'iPhone 7 Plus', colors: ['Negro', 'Negro Brillante', 'Plata', 'Oro', 'Oro Rosa', 'Rojo'], storages: ['32gb', '128gb', '256gb'] },
  { model: 'iPhone 7', colors: ['Negro', 'Negro Brillante', 'Plata', 'Oro', 'Oro Rosa', 'Rojo'], storages: ['32gb', '128gb', '256gb'] },
];

// Organizar modelos por serie
const organizeModels = () => {
  const structure: { [key: string]: string[] } = {
    '17': [],
    '16': [],
    '15': [],
    '14': [],
    '13': [],
    '12': [],
    '11': [],
    '10': [], // X series
    'SE': [],
    '8': [],
    '7': [],
  };

  iphoneModels.forEach((phone) => {
    const model = phone.model;
    if (model.includes('17')) structure['17'].push(model);
    else if (model.includes('16')) structure['16'].push(model);
    else if (model.includes('15')) structure['15'].push(model);
    else if (model.includes('14')) structure['14'].push(model);
    else if (model.includes('13')) structure['13'].push(model);
    else if (model.includes('12')) structure['12'].push(model);
    else if (model.includes('11')) structure['11'].push(model);
    else if (model.includes('X')) structure['10'].push(model);
    else if (model.includes('SE')) structure['SE'].push(model);
    else if (model.includes('8')) structure['8'].push(model);
    else if (model.includes('7')) structure['7'].push(model);
  });

  return structure;
};

const staticModels = organizeModels();

// Obtener modelos ocultos del localStorage
const getHiddenModels = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const hidden = localStorage.getItem('hiddenModels');
    return hidden ? JSON.parse(hidden) : [];
  } catch {
    return [];
  }
};

export default function useSelectIPhone() {
  const [hiddenModels, setHiddenModels] = useState<string[]>([]);
  const notes = useField({ type: 'text' });

  // Cargar modelos ocultos al inicio y escuchar cambios
  useState(() => {
    setHiddenModels(getHiddenModels());
    
    const handleUpdate = () => {
      setHiddenModels(getHiddenModels());
    };
    
    window.addEventListener('hiddenModelsUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('hiddenModelsUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  });

  // Filtrar modelos ocultos
  const filteredModels = useMemo(() => {
    const result: { [key: string]: string[] } = {};
    for (const [key, models] of Object.entries(staticModels)) {
      const visible = models.filter(m => !hiddenModels.includes(m));
      if (visible.length > 0) {
        result[key] = visible;
      }
    }
    return result;
  }, [hiddenModels]);

  // Filtrar lista de iPhones
  const filteredIphones = useMemo(() => {
    return iphoneModels.filter(phone => !hiddenModels.includes(phone.model));
  }, [hiddenModels]);

  return { models: filteredModels, notes, iphonesLS: filteredIphones };
}
