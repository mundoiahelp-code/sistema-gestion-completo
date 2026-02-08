'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useVisibleAccessories, ACCESSORY_GROUPS } from '@/hooks/useVisibleModels';

// Re-exportar para compatibilidad con código existente
export const ACCESSORY_CATEGORIES = ACCESSORY_GROUPS;
export const ALL_ACCESSORY_TYPES = Object.values(ACCESSORY_GROUPS).flat();

// Función para obtener productos ocultos
const getHiddenAccessories = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('hiddenAccessories') || '[]');
  } catch {
    return [];
  }
};

// Función para obtener tipos visibles de una categoría
const getVisibleTypes = (category: string): string[] => {
  const types = ACCESSORY_CATEGORIES[category as keyof typeof ACCESSORY_CATEGORIES] || [];
  const hidden = getHiddenAccessories();
  return types.filter(t => !hidden.includes(t));
};

// Función para obtener categorías que tienen al menos un tipo visible
const getVisibleCategories = (): string[] => {
  const hidden = getHiddenAccessories();
  return Object.keys(ACCESSORY_CATEGORIES).filter(cat => {
    const types = ACCESSORY_CATEGORIES[cat as keyof typeof ACCESSORY_CATEGORIES];
    return types.some(t => !hidden.includes(t));
  });
};

// Función para obtener todos los tipos visibles
const getVisibleAllTypes = (): string[] => {
  const hidden = getHiddenAccessories();
  return ALL_ACCESSORY_TYPES.filter(t => !hidden.includes(t));
};

interface Props {
  onFilterChange: (filters: AccessoryFilters) => void;
  currentFilters: AccessoryFilters;
}

export interface AccessoryFilters {
  category: string;
  type: string;
  stockStatus: string;
  priceRange: string;
}

export default function AccessoriesFilters({ onFilterChange, currentFilters }: Props) {
  const [filters, setFilters] = useState<AccessoryFilters>({
    category: currentFilters.category || 'all',
    type: currentFilters.type || 'all',
    stockStatus: currentFilters.stockStatus || 'all',
    priceRange: currentFilters.priceRange || 'all',
  });
  const [hasFilters, setHasFilters] = useState(false);
  const { visibleAccessoryGroups } = useVisibleAccessories();
  const visibleCategories = Object.keys(visibleAccessoryGroups);

  const handleFilterChange = (key: keyof AccessoryFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Convertir "all" a string vacío solo al aplicar filtros
    const processedFilters = {
      category: filters.category === 'all' ? '' : filters.category,
      type: filters.type === 'all' ? '' : filters.type,
      stockStatus: filters.stockStatus === 'all' ? '' : filters.stockStatus,
      priceRange: filters.priceRange === 'all' ? '' : filters.priceRange,
    };
    onFilterChange(processedFilters);
    setHasFilters(Object.values(processedFilters).some((v) => v !== ''));
  };

  const handleClearFilters = () => {
    const emptyFilters: AccessoryFilters = {
      category: 'all',
      type: 'all',
      stockStatus: 'all',
      priceRange: 'all',
    };
    setFilters(emptyFilters);
    onFilterChange({
      category: '',
      type: '',
      stockStatus: '',
      priceRange: '',
    });
    setHasFilters(false);
  };

  // Obtener tipos según la categoría seleccionada (filtrando ocultos)
  const availableTypes = filters.category && filters.category !== 'all'
    ? (visibleAccessoryGroups[filters.category] || [])
    : Object.values(visibleAccessoryGroups).flat();

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1" className="bg-white dark:bg-zinc-900 mb-2 px-4 rounded-lg border dark:border-zinc-800">
        <AccordionTrigger>Filtros</AccordionTrigger>
        <AccordionContent className="grid grid-cols-1 lg:grid-cols-4 px-4 gap-3">
          {/* Categoría */}
          <div>
            <Label>Categoría</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(v) => {
                // Actualizar ambos valores en un solo setState
                setFilters({
                  ...filters,
                  category: v,
                  type: 'all'
                });
              }}
            >
              <SelectTrigger>
                {filters.category && filters.category !== 'all' ? filters.category : 'Todas las categorías'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {visibleCategories.map((cat) => (
                  <SelectItem value={cat} key={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de accesorio */}
          <div>
            <Label>Tipo de accesorio</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(v) => handleFilterChange('type', v)}
              disabled={!filters.category || filters.category === 'all'}
            >
              <SelectTrigger disabled={!filters.category || filters.category === 'all'}>
                {!filters.category || filters.category === 'all'
                  ? 'Seleccioná una categoría primero'
                  : filters.type && filters.type !== 'all'
                    ? filters.type 
                    : 'Todos los tipos'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem value={type} key={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado de stock */}
          <div>
            <Label>Estado de stock</Label>
            <Select
              value={filters.stockStatus || 'all'}
              onValueChange={(v) => handleFilterChange('stockStatus', v)}
            >
              <SelectTrigger>
                {filters.stockStatus === 'inStock'
                  ? 'En stock'
                  : filters.stockStatus === 'lowStock'
                    ? 'Stock bajo'
                    : filters.stockStatus === 'outOfStock'
                      ? 'Sin stock'
                      : filters.stockStatus === 'reserved'
                        ? 'Con reservas'
                        : 'Todos'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inStock">En stock (más de 5)</SelectItem>
                <SelectItem value="lowStock">Stock bajo (1-5)</SelectItem>
                <SelectItem value="outOfStock">Sin stock</SelectItem>
                <SelectItem value="reserved">Con reservas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rango de precio */}
          <div>
            <Label>Rango de precio</Label>
            <Select
              value={filters.priceRange || 'all'}
              onValueChange={(v) => handleFilterChange('priceRange', v)}
            >
              <SelectTrigger>
                {filters.priceRange === '0-5000'
                  ? '$0 - $5.000'
                  : filters.priceRange === '5000-15000'
                    ? '$5.000 - $15.000'
                    : filters.priceRange === '15000-50000'
                      ? '$15.000 - $50.000'
                      : filters.priceRange === '50000+'
                        ? 'Más de $50.000'
                        : 'Todos los precios'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los precios</SelectItem>
                <SelectItem value="0-5000">$0 - $5.000</SelectItem>
                <SelectItem value="5000-15000">$5.000 - $15.000</SelectItem>
                <SelectItem value="15000-50000">$15.000 - $50.000</SelectItem>
                <SelectItem value="50000+">Más de $50.000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
            {hasFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Borrar filtros
              </Button>
            )}
            <Button onClick={handleApplyFilters}>Filtrar</Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
