import { IOrder } from './schemas.interfaces';

export interface IDashboard {
  users: {
    admins: number;
    vendors: number;
    assistants: number;
  };
  catalogue: {
    phones: number;
    lastOrders: IOrder[];
    totalAmount: number;
    totalReserved: number;
    phonesStock: number;
    accessoriesStock: number;
    capitalIphones: number;
    capitalAccessories: number;
  };
  sales: {
    clients: number;
    totalSales: number;
    lastSales: any[];
    salesByMonth: { month: string; total: number }[];
    amountMonth: number;
    earningsUSD: number;
    earningsARS: number;
  };
  salesSummary?: {
    today: { count: number; total: number };
    week: { count: number; total: number };
    month: { count: number; total: number };
  };
}
