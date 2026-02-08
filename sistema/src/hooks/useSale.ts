import axios, { AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { API } from '@/config/api';
import { Payment } from '@/enums/payment.enum';
import { IClient, IPhone } from '@/interfaces/schemas.interfaces';
import useCookie from './useCookie';
import useField from './useField';
import useSonner from './useSonner';

interface IResume {
  subTotal: number;
  discount: number;
  totalAmount: number;
  totalCost: number;
  profit: number;
  totalUSD: number;
  totalARS: number;
}

interface IPhonePayment {
  model: string;
  color: string;
  storage: string;
  battery: string;
  price: number;
}

export default function useSale() {
  const [accessToken, setAccessToken] = useCookie('accessToken', false);

  const { handleErrorSonner, handleSuccessSonner } = useSonner();

  const [client, setClient] = useState<IClient | null>(null);
  const [items, setItems] = useState<IPhone[]>([]);

  const [phonePayment, setPhonePayment] = useState<IPhonePayment[]>([]);
  const [initialPrice, setInitialPrice] = useState<string>('');
  const [saleType, setSaleType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');
  

  
  // Campos para venta mayorista
  const wholesaleClientName = useField({ type: 'text' });
  const wholesaleUnits = useField({ type: 'text', validation: /^[0-9]*$/ });

  // Cargar producto desde "Vender rápido"
  useEffect(() => {
    const quickSellProduct = localStorage.getItem('quickSellProduct');
    const quickSellAccessory = localStorage.getItem('quickSellAccessory');
    
    if (quickSellProduct) {
      try {
        const product = JSON.parse(quickSellProduct);
        setItems([product]);
        // Autocompletar el precio de venta
        if (product.price) {
          amount.onChange(String(product.price));
        }
        localStorage.removeItem('quickSellProduct');
      } catch (e) {
        // Error silencioso en producción
      }
    }
    
    if (quickSellAccessory) {
      try {
        const accessory = JSON.parse(quickSellAccessory);
        const qty = accessory.quantity || 1;
        const newItem = { ...accessory, quantity: qty };
        setItems([newItem]);
        // Autocompletar el precio de venta (precio * cantidad)
        if (accessory.price) {
          amount.onChange(String(accessory.price * qty));
        }
        localStorage.removeItem('quickSellAccessory');
      } catch (e) {
        // Error silencioso en producción
      }
    }
  }, []);

  const [resume, setResume] = useState<IResume>({
    subTotal: 0,
    discount: 0,
    totalAmount: 0,
    totalCost: 0,
    profit: 0,
    totalUSD: 0,
    totalARS: 0,
  });

  const [loading, setLoading] = useState(false);

  const notes = useField({ type: 'text' });

  const [payment, setPayment] = useState<{ amount: string; type: Payment }[]>([
    { type: '' as Payment, amount: '0' },
  ]);

  const amount = useField({ type: 'text', validation: /^[0-9]*$/ });

  // Autocompletar precio cuando hay un producto de venta rápida
  useEffect(() => {
    if (initialPrice && !amount.value) {
      amount.onChange(initialPrice);
    }
  }, [initialPrice]);

  const router = useRouter();



  const updateAmount = (currItems: IPhone[], autoUpdatePrice: boolean = false) => {
    let totalUSD = 0;
    let totalARS = 0;
    let totalCost = 0;

    currItems.forEach((x: any) => {
      const qty = x.quantity || 1;
      // iPhones = USD, Accesorios = ARS (fijo)
      const isAccessory = x.category === 'ACCESSORY' || !x.imei;
      
      if (isAccessory) {
        totalARS += x.price * qty;
      } else {
        totalUSD += x.price * qty;
      }
      totalCost += (x.cost || 0) * qty;
    });

    // El subtotal es solo para referencia visual (no se usa para conversión)
    const subTotal = totalUSD + totalARS; // Suma simple sin conversión
    let totalAmount = 0;
    let discount = 0;

    if (amount.value) {
      totalAmount = +amount.value;
    }

    phonePayment.forEach((x) => {
      discount += +x.price;
    });

    totalAmount -= phonePayment.reduce((acc, x) => acc + x.price, 0);
    
    const profit = totalAmount - totalCost;

    setResume({ 
      discount, 
      subTotal, 
      totalAmount, 
      totalCost, 
      profit,
      totalUSD,
      totalARS,
    });
  };

  const handleSearchClient = async (typed: string) => {
    if (typed.length <= 3)
      return handleErrorSonner('Ingrese minimo 3 caracteres');

    const config: AxiosRequestConfig = {
      url: `${API}/clients?search=${typed}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    setLoading(true);
    return await axios(config)
      .then((res) => {
        // El backend devuelve { clients: [...] }
        return res.data.clients || res.data || [];
      })
      .catch((err) => {
        handleErrorSonner('Hubo un errror en el sistema');
      })
      .finally(() => setLoading(false));
  };

  const handleSelectClient = (client: IClient) => {
    setClient(client);
  };

  const handleAddItem = (imei: string) => {
    const exists = items.findIndex((x) => x.imei === imei);
    if (exists !== -1) {
      const newItems = items.filter((x) => x.imei !== imei);
      setItems(newItems);
      updateAmount(newItems, true);
      return handleSuccessSonner('Producto eliminado');
    }

    const config: AxiosRequestConfig = {
      url: `${API}/products?search=${imei}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    setLoading(true);
    axios(config)
      .then((res) => {
        const products = res.data.products || res.data || [];
        const product = products.find((p: any) => p.imei === imei);
        if (product) {
          const newItems = [...items, product];
          setItems(newItems);
          updateAmount(newItems, true);
          return handleSuccessSonner('Producto agregado');
        }
        handleErrorSonner('El producto no existe');
      })
      .catch((err) => {
        handleErrorSonner('Hubo un errror en el sistema');
      })
      .finally(() => setLoading(false));
  };

  const handleAddAccessory = (accessory: any, quantity: number) => {
    // Verificar si ya existe
    const existsIndex = items.findIndex((x) => x.id === accessory.id);
    if (existsIndex !== -1) {
      // Actualizar cantidad
      const currItems = [...items];
      currItems[existsIndex] = {
        ...currItems[existsIndex],
        quantity: (currItems[existsIndex].quantity || 1) + quantity,
      };
      setItems(currItems);
      updateAmount(currItems, true);
      return handleSuccessSonner('Cantidad actualizada');
    }

    // Agregar nuevo
    const newItem = {
      ...accessory,
      quantity,
    };
    const currItems = [...items, newItem];
    setItems(currItems);
    updateAmount(currItems, true);
    handleSuccessSonner('Accesorio agregado');
  };

  const handleRemoveItem = (id: string) => {
    const currItems = items.filter((x) => x.id !== id);
    setItems(currItems);
    updateAmount(currItems, true);
    handleSuccessSonner('Producto eliminado');
  };

  const handleConfirmSale = async () => {
    if (items.length === 0) return handleErrorSonner('Agregue al menos un producto');
    if (!amount.value || amount.value === '0') return handleErrorSonner('Ingrese el monto');
    
    // Validaciones para venta mayorista
    if (saleType === 'WHOLESALE') {
      if (!wholesaleClientName.value) return handleErrorSonner('Ingrese el nombre del cliente mayorista');
    }
    
    const payments = payment.filter((x: any) => x.type !== '');
    if (payments.length === 0) return handleErrorSonner('Seleccione un método de pago');

    // Mapear método de pago al formato del backend
    const paymentMethodMap: Record<string, string> = {
      [Payment.EFECTIVE_ARS]: 'CASH',
      [Payment.EFECTIVE_USD]: 'CASH',
      [Payment.EFECTIVE_EUROS]: 'CASH',
      [Payment.TRANSFER_ARS]: 'TRANSFER',
      [Payment.TRANSFER_USDT]: 'TRANSFER',
    };

    // Si hay múltiples métodos de pago, usar MIXED
    const paymentMethod = payments.length > 1 ? 'MIXED' : (paymentMethodMap[payments[0]?.type] || 'CASH');

    // Necesitamos obtener el storeId - usar el de los items si está disponible, o el primero
    let storeId = '';
    
    // Buscar si algún item tiene selectedStoreId (de venta rápida de accesorio)
    const itemWithStore = items.find((item: any) => item.selectedStoreId);
    if (itemWithStore) {
      storeId = (itemWithStore as any).selectedStoreId;
    }
    
    // Si no hay storeId de items, obtener el primero disponible
    if (!storeId) {
      try {
        const storesRes = await axios.get(`${API}/stores`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const stores = storesRes.data.stores || storesRes.data || [];
        if (stores.length > 0) {
          storeId = stores[0].id;
        }
      } catch (err) {
        // Error silencioso en producción
      }
    }

    if (!storeId) {
      return handleErrorSonner('No hay tiendas configuradas');
    }

    // Preparar items para el backend
    const saleItems = items.map((item: any) => ({
      productId: item.id,
      quantity: item.quantity || 1,
      price: item.price,
      storeId: item.selectedStoreId || storeId, // Usar sucursal específica si está disponible
    }));

    // Construir notas con detalles de pagos
    let saleNotes = notes.value || '';
    
    // Agregar información de venta mayorista
    if (saleType === 'WHOLESALE') {
      saleNotes += saleNotes ? `\n` : '';
      saleNotes += `VENTA MAYORISTA\nCliente: ${wholesaleClientName.value}\nUnidades solicitadas: ${wholesaleUnits.value}`;
    }
    
    // Agregar detalles de métodos de pago
    if (payments.length > 0) {
      const paymentDetails = payments.map(p => `${p.type}: $${p.amount}`).join(', ');
      saleNotes += saleNotes ? `\n` : '';
      saleNotes += `Pagos: ${paymentDetails}`;
    }
    
    // Agregar detalles de celular como pago
    if (phonePayment.length > 0) {
      const phoneDetails = phonePayment.map(p => `${p.model} ${p.color} ${p.storage} ${p.battery}% - $${p.price}`).join(', ');
      saleNotes += `\nCelular en pago: ${phoneDetails}`;
    }

    // Calcular descuento total (incluye celular como pago)
    const totalPhonePaymentValue = phonePayment.reduce((acc, p) => acc + p.price, 0);
    const totalDiscount = (resume.discount > 0 ? resume.discount : 0) + totalPhonePaymentValue;

    const data = {
      total: +amount.value,
      discount: totalDiscount,
      paymentMethod,
      saleType,
      notes: saleNotes || undefined,
      clientId: client?.id || undefined,
      storeId,
      items: saleItems,
    };

    const config: AxiosRequestConfig = {
      url: `${API}/sales`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data,
    };

    setLoading(true);
    axios(config)
      .then((res) => {
        const response = res.data;
        
        if (response.error) {
          return handleErrorSonner(response.error);
        }

        if (response.sale) {
          handleSuccessSonner('La venta se confirmo!');
          router.push('/ventas');
          router.refresh();
        }
      })
      .catch((err) => {
        // Error silencioso en producción
        handleErrorSonner(err.response?.data?.error || 'Hubo un error en el sistema');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    updateAmount(items);
  }, [amount.value, phonePayment, items]);

  return {
    client,
    items,
    notes,
    amount,
    payment,
    setPayment,
    handleSearchClient,
    handleAddItem,
    handleAddAccessory,
    handleRemoveItem,
    handleSelectClient,
    loading,
    resume,
    handleConfirmSale,
    phonePayment,
    setPhonePayment,
    saleType,
    setSaleType,
    wholesaleClientName,
    wholesaleUnits,
  };
}
