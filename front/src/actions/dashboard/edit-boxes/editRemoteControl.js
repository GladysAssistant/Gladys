import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getRemoteControl(state, remoteType) {
      store.setState({
        DashboardRemoteControlStatus: RequestStatus.Getting
      });
      try {
        const remoteDevices = await state.httpClient.get(`/api/v1/remote-control/${remoteType}`);
        store.setState({
          remoteDevices,
          DashboardRemoteControlStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DashboardRemoteControlStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
