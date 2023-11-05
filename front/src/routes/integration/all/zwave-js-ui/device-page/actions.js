import { RequestStatus } from '../../../../../utils/consts';
import { DEFAULT } from '../../../../../../../server/services/zwave-js-ui/lib/constants';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getZWaveDevices(state) {
      store.setState({
        zwaveGetDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          orderDir: state.orderDir || DEFAULT.NODES_ORDER_DIR
        };
        if (state.searchKeyword && state.searchKeyword.length) {
          options.search = state.searchKeyword;
        }
        const zwaveDevices = await state.httpClient.get('/api/v1/service/zwave-js-ui/device', options);
        store.setState({
          zwaveDevices,
          zwaveGetDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveGetDevicesStatus: RequestStatus.Error
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
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        zwaveDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        searchKeyword: e.target.value
      });
      await actions.getZWaveDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        orderDir: e.target.value
      });
      await actions.getZWaveDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
