import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getBluetoothDevices(state) {
      store.setState({
        getBluetoothDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'bluetooth',
          order_dir: state.getBluetoothDeviceOrderDir || 'asc'
        };
        if (state.bluetoothDeviceSearch && state.bluetoothDeviceSearch.length) {
          options.search = state.bluetoothDeviceSearch;
        }
        const bluetoothDevices = await state.httpClient.get('/api/v1/service/bluetooth/device', options);
        store.setState({
          bluetoothDevices,
          getBluetoothDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getBluetoothDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        bluetoothDevices: {
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
        bluetoothDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        bluetoothDeviceSearch: e.target.value
      });
      await actions.getBluetoothDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getBluetoothDeviceOrderDir: e.target.value
      });
      await actions.getBluetoothDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
