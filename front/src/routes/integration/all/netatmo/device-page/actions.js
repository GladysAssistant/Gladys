import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getNetatmoDevices(state) {
      store.setState({
        getNetatmoDevicesStatus: RequestStatus.Getting
      });
      try {
        const netatmoDevices = await state.httpClient.get('/api/v1/service/netatmo/thermostat');
        const netatmoDevicesMap = new Map();
        netatmoDevices.forEach(device => netatmoDevicesMap.set(device.external_id, device));
        store.setState({
          netatmoDevicesMap,
          netatmoDevices,
          getNetatmoDevicesStatus: RequestStatus.Success
        })
      } catch (e) {
        store.setState({
          getNetatmoDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getNetatmoNewDevices(state) {
      store.setState({
        getNetatmoNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const netatmoNewDevices = await state.httpClient.get('/api/v1/service/netatmo/new-thermostat');
        const netatmoNewDevicesFiltered = netatmoNewDevices.filter(device => {
          if (!state.netatmoDevicesMap) {
            return true;
          }
          return !state.netatmoDevicesMap.has(device.external_id);
        });
        store.setState({
          netatmoNewDevices: netatmoNewDevicesFiltered,
          getNetatmoNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getNetatmoNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async createDevice(state, device) {
      store.setState({
        getNetatmoCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getNetatmoCreateDeviceStatus: RequestStatus.Success
        });
        actions.getNetatmoDevices(store.getState());
      } catch (e) {
        store.setState({
          getNetatmoCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
