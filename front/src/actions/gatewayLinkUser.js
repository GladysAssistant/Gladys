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
        store.setState({
          usersGetStatus: RequestStatus.Error
        });
      }
    },
    async saveUser(state, userId) {
      await state.session.gatewayClient.updateUserIdInGladys(userId);
    }
  };
  return actions;
}

export default createActions;
