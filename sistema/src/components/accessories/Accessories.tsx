'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import ErrorRequest from '../common/ErrorRequest';
import AccessoriesTable from './AccessoriesTable';
import AccessoriesLoading from './AccessoriesLoading';
import AccessoriesFilters, { AccessoryFilters } from './AccessoriesFilters';
import { useHiddenModels } from '@/hooks/useHiddenModels';

interface Props {
  query: { [key: string]: string };
}

export default function Accessories({ query }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isAccessoryHidden } = useHiddenModels();
  const [filters, setFilters] = useState<AccessoryFilters>({
    category: '',
    type: '',
    stockStatus: '',
    priceRange: '',
  });

  useEffect(() => {
    const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
    // Usar endpoint agrupado que incluye stock por sucursal
    axios.get(`${API}/products/accessories-grouped`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        const accessories = res.data.accessories || [];
        // NO filtrar accesorios ocultos en la vista de stock
        // Los accesorios ocultos solo se filtran en selectores
        setItems(accessories);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Accessories error:', err);
        setError(true);
        setLoading(false);
      });
  }, [query]);

  // Filtrar items según los filtros seleccionados
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filtro por tipo (busca en nombre o modelo)
      if (filters.type) {
        const searchTerm = filters.type.toLowerCase();
        const name = (item.name || '').toLowerCase();
        const model = (item.model || '').toLowerCase();
        if (!name.includes(searchTerm) && !model.includes(searchTerm)) {
          return false;
        }
      }

      // Filtro por categoría (busca palabras clave en nombre)
      if (filters.category) {
        const name = (item.name || '').toLowerCase();
        const model = (item.model || '').toLowerCase();
        const categoryKeywords: { [key: string]: string[] } = {
          'Fundas y Protección': ['funda', 'protector', 'vidrio', 'case', 'cover'],
          'Carga y Energía': ['cargador', 'cable', 'batería', 'power', 'usb', 'lightning', 'magsafe'],
          'Audio': ['airpods', 'earpods', 'auricular', 'audio', 'adaptador 3.5'],
          'Apple Watch': ['watch', 'correa', 'band'],
          'iPad': ['ipad', 'pencil', 'folio', 'keyboard'],
          'Mac': ['mac', 'magic', 'mouse', 'trackpad', 'hub'],
          'Otros': ['airtag', 'homepod', 'apple tv', 'paño'],
        };
        const keywords = categoryKeywords[filters.category] || [];
        const matchesCategory = keywords.some(
          (kw) => name.includes(kw) || model.includes(kw)
        );
        if (!matchesCategory) {
          return false;
        }
      }

      // Filtro por estado de stock
      if (filters.stockStatus) {
        const stock = item.stock || 0;
        const reserved = item.reserved || 0;
        switch (filters.stockStatus) {
          case 'inStock':
            if (stock <= 5) return false;
            break;
          case 'lowStock':
            if (stock === 0 || stock > 5) return false;
            break;
          case 'outOfStock':
            if (stock > 0) return false;
            break;
          case 'reserved':
            if (reserved === 0) return false;
            break;
        }
      }

      // Filtro por rango de precio
      if (filters.priceRange) {
        const price = item.price || 0;
        switch (filters.priceRange) {
          case '0-5000':
            if (price > 5000) return false;
            break;
          case '5000-15000':
            if (price < 5000 || price > 15000) return false;
            break;
          case '15000-50000':
            if (price < 15000 || price > 50000) return false;
            break;
          case '50000+':
            if (price < 50000) return false;
            break;
        }
      }

      return true;
    });
  }, [items, filters]);

  if (loading) return <AccessoriesLoading />;
  if (error) return <ErrorRequest />;

  return (
    <div>
      <AccessoriesFilters
        onFilterChange={setFilters}
        currentFilters={filters}
      />
      <AccessoriesTable data={filteredItems} />
    </div>
  );
}
