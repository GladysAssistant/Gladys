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
    async getNetatmoSensors(state) {
      store.setState({
        getNetatmoDevicesStatus: RequestStatus.Getting
      });
      try {
        const netatmoSensors = await state.httpClient.get('/api/v1/service/netatmo/sensor');
        console.log(netatmoSensors)
        const netatmoSensorsFiltered = netatmoSensors.filter(sensor => {
          if (!state.netatmoSensorsMap) {
            return true;
          }
          return !state.netatmoSensorsMap.has(sensor.external_id);
        })
        store.setState({
          netatmoSensors: netatmoSensorsFiltered,
          getNetatmoSensorsStatus: RequestStatus.Success
        })
      } catch (e) {
        store.setState({
          getNetatmoSensorsStatus: RequestStatus.Error
        });
      }
    },
    async getNetatmoDevices(state) {
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
