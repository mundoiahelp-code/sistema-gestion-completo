import EmptyRequest from '@/components/common/EmptyData';
import ErrorRequest from '@/components/common/ErrorRequest';
import useGetRequest from '@/hooks/useGetRequest';
import { IPhone } from '@/interfaces/schemas.interfaces';
import Product from './Product';

type Phone = IPhone & { store: { id: string; icon: string; name: string } };

interface ProductData {
  id: string;
  name: string;
  model: string;
  storage?: string;
  color?: string;
  imei?: string;
  battery?: number;
  price: number;
  cost?: number;
  stock: number;
  condition: string;
  category: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  store: { id: string; name: string };
}

export default async function Single({ imei }: { imei: string }) {
  // Buscar producto por IMEI usando el endpoint de búsqueda
  const { data, err } = await useGetRequest<{ products: ProductData[] }>(
    `products?search=${imei}`
  );

  if (err) return <ErrorRequest />;

  // Buscar el producto exacto con ese IMEI
  const product = data?.products?.find((p) => p.imei === imei);

  if (!product) return <EmptyRequest />;

  // Adaptar datos al formato esperado por Product
  const productData: Phone = {
    id: product.id,
    imei: product.imei || imei,
    brand: 'Apple',
    model: product.model || product.name,
    color: product.color || '',
    storage: product.storage || '',
    battery: product.battery || 0,
    price: product.price || 0,
    cost: product.cost || 0,
    details: product.description || '',
    name: product.name,
    reserved: false,
    date_selled: new Date(),
    selled: false,
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt),
    movements: [],
    store: { 
      id: product.store?.id || '', 
      icon: 'store', 
      name: product.store?.name || '' 
    }
  } as any;

  return <Product data={productData} />;
}
