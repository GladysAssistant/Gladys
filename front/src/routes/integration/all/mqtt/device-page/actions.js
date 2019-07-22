import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getMqttDevices(state, take, skip) {
      store.setState({
        getMqttDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'mqtt',
          order_dir: state.getMqttDeviceOrderDir || 'asc',
          take,
          skip
        };
        if (state.mqttDeviceSearch && state.mqttDeviceSearch.length) {
          options.search = state.mqttDeviceSearch;
        }
        const mqttDevicesReceived = await state.httpClient.get('/api/v1/service/mqtt/device', options);
        let mqttDevices;
        if (skip === 0) {
          mqttDevices = mqttDevicesReceived;
        } else {
          mqttDevices = update(state.mqttDevices, {
            $push: mqttDevicesReceived
          });
        }
        store.setState({
          mqttDevices,
          getMqttDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getMqttDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        mqttDevices: {
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
        mqttDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        mqttDeviceSearch: e.target.value
      });
      await actions.getMqttDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getMqttDeviceOrderDir: e.target.value
      });
      await actions.getMqttDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
