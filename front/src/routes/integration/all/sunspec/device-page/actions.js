import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getSunSpecDevices(state) {
      store.setState({
        getSunSpecDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'sunspec',
          order_dir: state.getSunSpecDeviceOrderDir || 'asc'
        };
        if (state.sunspecDeviceSearch && state.sunspecDeviceSearch.length) {
          options.search = state.sunspecDeviceSearch;
        }
        const sunspecDevices = await state.httpClient.get('/api/v1/service/sunspec/device', options);
        store.setState({
          sunspecDevices,
          getSunSpecDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getSunSpecDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, deviceIndex) {
      const device = state.sunspecDevices[deviceIndex];

      try {
        const savedDevice = await state.httpClient.post('/api/v1/device', device);
        const newState = update(state, {
          sunspecDevices: {
            [deviceIndex]: {
              $set: savedDevice
            }
          }
        });
        store.setState(newState);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        sunspecDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        sunspecDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        sunspecDeviceSearch: e.target.value
      });
      await actions.getSunSpecDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getSunSpecDeviceOrderDir: e.target.value
      });
      await actions.getSunSpecDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
