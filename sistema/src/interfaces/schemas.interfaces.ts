import { Payment } from '@/enums/payment.enum';
import { Role } from '@/enums/role.enum';
import { SaleType } from '@/enums/saleType.enum';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  preferences: {
    colorIcon: string;
  };
}

export interface IPhone {
  id: string;
  imei: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  battery: number;
  price: number;
  cost?: number;
  stock?: number;
  details: string;
  name: string;
  store: string;
  reserved: boolean;
  date_selled: Date;
  selled: boolean;
  createdAt: Date;
  updatedAt: Date;
  movements: string[];
  quantity?: number;
  category?: string;
}

export interface IIPhone {
  id: string;
  model: string;
  colors: string[];
  storages: string[];
}

export interface IOrder {
  id: string;
  code: string;
  items: string[];
  totalItems: number;
  notes: string;
  vendor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClient {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  zone: string;
  page: string;
  // discount: number;
  createdAt: Date;
  updatedAt: Date;
}

type Item = {
  id: string;
  imei: string;
  model: string;
  color: string;
  storage: string;
  battery: number;
  price: number;
};

export interface ISale {
  id: string;
  code: string;
  client: {
    id: string;
    name: string;
    dni: string;
    phone: string;
    email: string;
    zone: string;
    page: string;
  };
  items: Item[];
  amounts: {
    subTotal: number;
    discount: number;
    total: number;
  };
  type: SaleType;
  payment: { type: Payment; amount: number }[];
  phoneAsPayment: boolean;
  paymentPhone: {
    model: string;
    color: string;
    storage: string;
    battery: number;
    price: number;
  }[];
  total: number; // Campo del backend (Prisma)
  totalAmount: number; // Campo legacy
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  cancelled: boolean;
}

export interface IList {
  type: SaleType;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}
