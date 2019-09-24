import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getXiaomiSensors(state) {
      store.setState({
        getXiaomiSensorsStatus: RequestStatus.Getting
      });
      try {
        const xiaomiSensors = await state.httpClient.get('/api/v1/service/xiaomi/sensor');
        store.setState({
          xiaomiSensors,
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
          service: 'xiaomi',
          order_dir: state.getXiaomiDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };
        if (state.xiaomiDeviceSearch && state.xiaomiDeviceSearch.length) {
          options.search = state.xiaomiDeviceSearch;
        }
        const xiaomiDevices = await state.httpClient.get('/api/v1/service/xiaomi/device', options);
        store.setState({
          xiaomiDevices,
          getXiaomiDevicesStatus: RequestStatus.Success
        });
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
      await state.httpClient.delete('/api/v1/device/' + device.selector);
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
  return Object.assign({}, houseActions, actions);
}

export default createActions;
