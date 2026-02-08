import { OrderTypes } from '@/context/order/order.types';
import { IPhone } from './phone.interface';

export interface IOrderContext {
  phones: IPhone[];
}

type ActionsType =
  | {
      type: OrderTypes.PRODUCT_ADD;
      payload: {
        imei: string;
      };
    }
  | {
      type: OrderTypes.PRODUCT_ADD_WITH_DATA;
      payload: {
        imei: string;
        phoneData?: Partial<IPhone>;
      };
    }
  | {
      type: OrderTypes.UPDATE_ONE;
      payload: {
        index: number;
        property?: string;
        value?: string;
      };
    }
  | {
      type: OrderTypes.PRODUCT_DELETE;
      payload: {
        index: number;
      };
    };

export interface IOrderContextType {
  state: IOrderContext;
  dispatch: React.Dispatch<ActionsType>;
}
