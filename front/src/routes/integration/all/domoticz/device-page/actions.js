import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getDomoticzDevices(state) {
      store.setState({
        getDomoticzDevicesStatus: RequestStatus.Getting
      });
      try {
        console.log('getDomoticzDevices');
        const options = {
          order_dir: state.getDomoticzDeviceOrderDir || 'asc'
        };
        if (state.domoticzDeviceSearch && state.domoticzDeviceSearch.length) {
          options.search = state.domoticzDeviceSearch;
        }
        const domoticzDevices = await state.httpClient.get('/api/v1/service/domoticz/devices', options);
        store.setState({
          domoticzDevices,
          getDomoticzDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getDomoticzDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        domoticzDevices: {
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
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        domoticzDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        domoticzDeviceSearch: e.target.value
      });
      await actions.getDomoticzDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getDomoticzDeviceOrderDir: e.target.value
      });
      await actions.getDomoticzDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
