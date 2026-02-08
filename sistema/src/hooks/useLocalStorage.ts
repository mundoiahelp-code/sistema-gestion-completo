import { useEffect, useState } from 'react';

export default function useLocalStorage(key: string, defaultValue: any) {
  const [value, setValue] = useState<any>(() => {
    // Intentar leer del localStorage en la inicialización
    if (typeof window !== 'undefined') {
      try {
        const stg = localStorage.getItem(key);
        if (stg && stg !== 'undefined' && stg !== 'null') {
          return JSON.parse(stg);
        }
      } catch (err) {
        console.error('Error reading localStorage:', err);
      }
    }
    return defaultValue;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Marcar como inicializado después del primer render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Solo guardar cambios en localStorage después de la inicialización
  // y solo si el valor cambió (no en el primer render)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error('Error writing localStorage:', err);
      }
    }
  }, [key, value, isInitialized]);

  return [value, setValue];
}
