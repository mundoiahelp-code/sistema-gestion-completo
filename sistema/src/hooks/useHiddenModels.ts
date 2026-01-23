import { useState, useEffect } from 'react';

export const useHiddenModels = () => {
  const [hiddenModels, setHiddenModels] = useState<string[]>([]);
  const [hiddenAccessories, setHiddenAccessories] = useState<string[]>([]);

  useEffect(() => {
    // Cargar desde localStorage
    const loadHidden = () => {
      try {
        const models = localStorage.getItem('hiddenModels');
        const accessories = localStorage.getItem('hiddenAccessories');
        
        setHiddenModels(models ? JSON.parse(models) : []);
        setHiddenAccessories(accessories ? JSON.parse(accessories) : []);
      } catch {
        setHiddenModels([]);
        setHiddenAccessories([]);
      }
    };

    loadHidden();

    // Escuchar cambios
    const handleUpdate = () => loadHidden();
    window.addEventListener('hiddenModelsUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('hiddenModelsUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isModelHidden = (model: string) => hiddenModels.includes(model);
  const isAccessoryHidden = (accessory: string) => hiddenAccessories.includes(accessory);

  return {
    hiddenModels,
    hiddenAccessories,
    isModelHidden,
    isAccessoryHidden,
  };
};
