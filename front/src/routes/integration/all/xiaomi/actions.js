import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getXiaomiSensors(state) {
      store.setState({
        getXiaomiSensorsStatus: RequestStatus.Getting
      });
      try {
        const xiaomiSensors = await state.httpClient.get('/api/v1/service/xiaomi/sensor');

        // remove sensors which are already added
        const xiaomiSensorsFiltered = xiaomiSensors.filter(sensor => {
          if (!state.xiaomiDevicesMap) {
            return true;
          }
          return !state.xiaomiDevicesMap.has(sensor.external_id);
        });
        store.setState({
          xiaomiSensors: xiaomiSensorsFiltered,
          getXiaomiSensorsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getXiaomiSensorsStatus: RequestStatus.Error
        });
      }
    },
    async getXiaomiDevices(state) {
      store.setState({
        getXiaomiDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getXiaomiDeviceOrderDir || 'asc'
        };
        if (state.xiaomiDeviceSearch && state.xiaomiDeviceSearch.length) {
          options.search = state.xiaomiDeviceSearch;
        }
        const xiaomiDevices = await state.httpClient.get('/api/v1/service/xiaomi/device', options);

        const xiaomiDevicesMap = new Map();
        xiaomiDevices.forEach(xiaomiDevice => {
          xiaomiDevicesMap.set(xiaomiDevice.external_id, xiaomiDevice);
        });
        store.setState({
          xiaomiDevices,
          xiaomiDevicesMap,
          getXiaomiDevicesStatus: RequestStatus.Success
        });
        actions.getXiaomiSensors(store.getState());
      } catch (e) {
        store.setState({
          getXiaomiDevicesStatus: RequestStatus.Error
        });
      }
    },
    async createDevice(state, device, sensorIndex) {
      await state.httpClient.post('/api/v1/device', device);
      await actions.getXiaomiDevices(store.getState());
      const newState = update(store.getState(), {
        xiaomiSensors: {
          $splice: [[sensorIndex, 1]]
        }
      });
      store.setState(newState);
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        xiaomiDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        xiaomiDevices: {
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
        xiaomiDeviceSearch: e.target.value
      });
      await actions.getXiaomiDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getXiaomiDeviceOrderDir: e.target.value
      });
      await actions.getXiaomiDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
