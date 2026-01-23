import { IOrderContext } from '@/interfaces/ordercontext.interface';
import { IPhone } from '@/interfaces/phone.interface';
import { OrderTypes } from './order.types';

interface OrderAction {
  type: OrderTypes;
  payload: {
    imei?: string;
    index?: number;
    property?: string;
    value?: string;
    phoneData?: Partial<IPhone>;
  };
}

const initPhone: IPhone = {
  imei: '',
  model: '',
  color: '',
  storage: '',
  battery: 0,
  price: 0,
  details: '',
};

export const reducer = (
  state: IOrderContext,
  action: OrderAction
): IOrderContext => {
  const { payload, type } = action;

  switch (type) {
    case 'PRODUCT_ADD': {
      const imeiInput = payload.imei as string;

      if (state.phones.length > 0) {
        return {
          phones: [
            ...state.phones,
            {
              ...initPhone,
              imei: imeiInput,
              model: state.phones[0].model,
              storage: state.phones[0].storage,
              price: state.phones[0].price,
            },
          ],
        };
      }

      return {
        phones: [...state.phones, { ...initPhone, imei: imeiInput }],
      };
    }

    case 'PRODUCT_ADD_WITH_DATA': {
      const imeiInput = payload.imei as string;
      const phoneData = payload.phoneData || {};

      return {
        phones: [
          ...state.phones,
          {
            ...initPhone,
            imei: imeiInput,
            model: phoneData.model || '',
            color: phoneData.color || '',
            storage: phoneData.storage || '',
            battery: phoneData.battery || 0,
            price: phoneData.price || 0,
            details: phoneData.details || '',
          },
        ],
      };
    }

    case 'UPDATE_ONE': {
      const phoneList = state.phones;
      phoneList[payload.index as number] = {
        ...phoneList[payload.index as number],
        [payload.property as string]: payload.value,
      };

      return { phones: phoneList };
    }

    case 'PRODUCT_DELETE': {
      const index = payload.index;
      const phoneListRemove = [...state.phones];
      phoneListRemove.splice(index as number, 1);

      return {
        phones: [...phoneListRemove],
      };
    }

    default:
      return state;
  }
};
