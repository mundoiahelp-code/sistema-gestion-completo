import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

export default function useCookie(
  name: string,
  defaultValue: string | boolean
) {
  const [value, setValue] = useState<any>(defaultValue);

  // Cargar valor inicial desde cookie solo en el cliente
  useEffect(() => {
    const cookie = Cookies.get(name);
    if (cookie) {
      setValue(cookie);
    }
  }, [name]);

  // Guardar cambios en cookie
  useEffect(() => {
    if (typeof value === 'string' && value !== defaultValue) {
      Cookies.set(name, value, { expires: 2 });
    }
  }, [name, value, defaultValue]);

  return [value, setValue];
}
