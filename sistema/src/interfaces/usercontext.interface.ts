import { UserTypes } from '@/context/user/user.types';
import { IUser } from './schemas.interfaces';

export interface IUserContext {
  user: {} | IUser;
  loggedIn: boolean;
}

type ActionsType =
  | {
      type: UserTypes.USER_SUCCESS;
      payload: { user: IUser };
    }
  | {
      type: UserTypes.USER_DISCONNECT;
      payload: { user: {} };
    }
  | {
      type: UserTypes.UPDATE_USER;
      payload: { user: IUser };
    };

export interface IUserContextType {
  state: IUserContext;
  dispatch: React.Dispatch<ActionsType>;
}
