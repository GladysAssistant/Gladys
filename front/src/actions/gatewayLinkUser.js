import get from 'get-value';
import { RequestStatus } from '../utils/consts';

function createActions(store) {
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
        const error = get(e, 'response.error');
        const errorMessage = get(e, 'response.error_message');
        const errorMessageOtherFormat = get(e, 'response.message');
        if (error === 'LINKED_USER_NOT_FOUND') {
          await state.session.gatewayClient.updateUserIdInGladys(null);
          window.location = '/link-gateway-user';
        } else if (errorMessage === 'NO_INSTANCE_FOUND' || errorMessageOtherFormat === 'NO_INSTANCE_DETECTED') {
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
