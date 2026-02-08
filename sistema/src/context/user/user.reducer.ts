import { IUser } from '@/interfaces/schemas.interfaces';
import { IUserContext } from '@/interfaces/usercontext.interface';
import { UserTypes } from './user.types';

interface UserAction {
  type: UserTypes;
  payload: { user: IUser | {} };
}

export const reducer = (
  state: IUserContext,
  action: UserAction
): IUserContext => {
  const { payload, type } = action;

  switch (type) {
    case UserTypes.USER_SUCCESS:
      return { ...state, user: payload.user, loggedIn: true };

    case UserTypes.USER_DISCONNECT:
      return { ...state, user: {}, loggedIn: false };

    case UserTypes.UPDATE_USER:
      return { ...state, user: payload.user };

    default:
      return state;
  }
};
