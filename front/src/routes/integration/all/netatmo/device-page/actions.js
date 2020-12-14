import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getNetatmoSensors(state) {
      store.setState({
        getNetatmoSensorsStatus: RequestStatus.Getting
      });
      try {
        const netatmoSensors = await state.httpClient.get('/api/v1/service/netatmo/sensor');

        const netatmoSensorsFiltered = netatmoSensors.filter(sensor => {
          if (!state.netatmoDevicesMap) {
            return true;
          }
          return !state.netatmoDevicesMap.has(sensor.external_id);
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
        getNetatmoDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getNetatmoDeviceOrderDir || 'asc'
        };
        if (state.netatmoDeviceSearch && state.netatmoDeviceSearch.length) {
          options.search = state.netatmoDeviceSearch;
        }
        const netatmoDevices = await state.httpClient.get('/api/v1/service/netatmo/device', options);
        const netatmoDevicesMap = new Map();
        netatmoDevices.forEach(netatmoDevice => {
          netatmoDevicesMap.set(netatmoDevice.external_id, netatmoDevice);
        });
        store.setState({
          netatmoDevices,
          netatmoDevicesMap,
          getNetatmoDevicesStatus: RequestStatus.Success
        });
        actions.getNetatmoSensors(store.getState());
      } catch (e) {
        store.setState({
          getNetatmoDevicesStatus: RequestStatus.Error
        });
      }
    },
    async createDevice(state, device, sensorIndex) {
      await state.httpClient.post('/api/v1/device', device);
      await actions.getNetatmoDevices(store.getState());
      const newState = update(store.getState(), {
        netatmoSensors: {
          $splice: [[sensorIndex, 1]]
        }
      });
      store.setState(newState);
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        netatmoDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        netatmoDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        netatmoDeviceSearch: e.target.value
      });
      await actions.getNetatmoDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getNetatmoDeviceOrderDir: e.target.value
      });
      await actions.getNetatmoDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
