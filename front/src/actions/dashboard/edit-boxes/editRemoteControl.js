import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getRemoteControl(state, remoteType) {
      store.setState({
        DashboardRemoteControlStatus: RequestStatus.Getting
      });

      const deviceOptions = {
        device_feature_category: remoteType
      };

      try {
        const remoteDevices = await state.httpClient.get('/api/v1/device', deviceOptions);
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
