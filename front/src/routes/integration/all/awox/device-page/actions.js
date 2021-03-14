import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getAwoxDevices(state) {
      store.setState({
        getAwoxDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'awox',
          order_dir: state.getAwoxDeviceOrderDir || 'asc'
        };
        if (state.awoxDeviceSearch && state.awoxDeviceSearch.length) {
          options.search = state.awoxDeviceSearch;
        }
        const awoxDevices = await state.httpClient.get('/api/v1/service/awox/device', options);
        store.setState({
          awoxDevices,
          getAwoxDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getAwoxDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        awoxDevices: {
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
        awoxDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        awoxDeviceSearch: e.target.value
      });
      await actions.getAwoxDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getAwoxDeviceOrderDir: e.target.value
      });
      await actions.getAwoxDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
