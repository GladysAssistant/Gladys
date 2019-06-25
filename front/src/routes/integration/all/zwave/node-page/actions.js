import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getZWaveDevices(state, take, skip) {
      store.setState({
        getZwaveDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'zwave',
          order_dir: state.getZwaveDeviceOrderDir || 'asc',
          take,
          skip
        };
        if (state.zwaveDeviceSearch && state.zwaveDeviceSearch.length) {
          options.search = state.zwaveDeviceSearch;
        }
        const zwaveDevicesReceived = await state.httpClient.get('/api/v1/service/zwave/device', options);
        let zwaveDevices;
        if (skip === 0) {
          zwaveDevices = zwaveDevicesReceived;
        } else {
          zwaveDevices = update(state.zwaveDevices, {
            $push: zwaveDevicesReceived
          });
        }
        store.setState({
          zwaveDevices,
          getZwaveDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getZwaveDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        zwaveDevices: {
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
        zwaveDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        zwaveDeviceSearch: e.target.value
      });
      await actions.getZWaveDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getZwaveDeviceOrderDir: e.target.value
      });
      await actions.getZWaveDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
