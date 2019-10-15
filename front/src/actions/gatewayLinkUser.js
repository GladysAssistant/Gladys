import get from 'get-value';
import { RequestStatus } from '../utils/consts';
import createActionsProfilePicture from './profilePicture';

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);
  const actions = {
    async getUsers(state) {
      store.setState({
        usersGetStatus: RequestStatus.Getting
      });
      try {
        const users = await state.httpClient.get(`/api/v1/user`);
        store.setState({
          users,
          usersGetStatus: RequestStatus.Success
        });
      } catch (e) {
        const errorMessage = get(e, 'response.error_message');
        if (errorMessage === 'NO_INSTANCE_FOUND') {
          store.setState({
            usersGetStatus: RequestStatus.GatewayNoInstanceFound
          });
        } else {
          store.setState({
            usersGetStatus: RequestStatus.Error
          });
        }
      }
    },
    async saveUser(state, userId) {
      await state.session.gatewayClient.updateUserIdInGladys(userId);
      // hard redirect, to reload websocket connection
      window.location = '/dashboard';
    }
  };
  return actions;
}

export default createActions;
