import { RequestStatus } from '../../../../../utils/consts';

import createActionsIntegration from '../../../../../actions/integration';
import createActionsHouse from '../../../../../actions/house';
import createActionsAwox from '../../bluetooth/commons/actions';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const houseActions = createActionsHouse(store);
  const awoxActions = createActionsAwox(store);
  const actions = {
    async getPeripherals(state) {
      store.setState({
        awoxGetPeripheralsStatus: RequestStatus.Getting
      });
      try {
        const awoxPeripherals = await state.httpClient.get('/api/v1/service/awox/peripheral');
        store.setState({
          awoxPeripherals,
          awoxGetPeripheralsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          awoxGetPeripheralsStatus: RequestStatus.Error
        });
      }
    },
    async resetSaveStatus() {
      store.setState({
        awoxSaveStatus: undefined
      });
    },
    async createDevice(state, device) {
      store.setState({
        awoxSaveStatus: RequestStatus.Getting
      });

      const { httpClient } = state;

      try {
        await httpClient.post(`/api/v1/device`, device);
        store.setState({
          awoxSaveStatus: RequestStatus.Success,
          awoxCreatedDevice: device
        });
      } catch (e) {
        store.setState({
          awoxSaveStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, integrationActions, houseActions, awoxActions);
};

export default createActions;
