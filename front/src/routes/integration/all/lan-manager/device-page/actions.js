import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getLANManagerDevices(state) {
      store.setState({
        getLANManagerDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'lan-manager',
          order_dir: state.getLANManagerDeviceOrderDir || 'asc'
        };
        if (state.lanManagerDeviceSearch && state.lanManagerDeviceSearch.length) {
          options.search = state.lanManagerDeviceSearch;
        }
        const lanManagerDevices = await state.httpClient.get('/api/v1/service/lan-manager/device', options);
        store.setState({
          lanManagerDevices,
          getLANManagerDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getLANManagerDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, deviceIndex) {
      const device = state.lanManagerDevices[deviceIndex];

      try {
        const savedDevice = await state.httpClient.post('/api/v1/device', device);
        const newState = update(state, {
          lanManagerDevices: {
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
        lanManagerDevices: {
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
        lanManagerDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        lanManagerDeviceSearch: e.target.value
      });
      await actions.getLANManagerDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getLANManagerDeviceOrderDir: e.target.value
      });
      await actions.getLANManagerDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
