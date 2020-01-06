import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import { BRIDGE_MODEL } from '../../../../../../../server/services/mi-light/lib/utils/consts';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getMiLightDevices(state) {
      store.setState({
        getMiLightDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'mqtt',
          order_dir: state.getMiLightDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };
        if (state.miLightDeviceSearch && state.miLightDeviceSearch.length) {
          options.search = state.miLightDeviceSearch;
        }
        const miLightDevicesReceived = await state.httpClient.get('/api/v1/service/mi-light/device', options);
        const miLightDevices = miLightDevicesReceived.filter(device => device.model !== BRIDGE_MODEL);
        store.setState({
          miLightDevices,
          getMiLightDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getMiLightDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getMiLightNewDevices(state) {
      store.setState({
        getMiLightNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const miLightNewDevices = await state.httpClient.get('/api/v1/service/mi-light/light');
        store.setState({
          miLightNewDevices,
          getMiLightNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getMiLightNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        miLightDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getMiLightCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getMiLightCreateDeviceStatus: RequestStatus.Success
        });
        actions.getMiLightDevices(store.getState());
      } catch (e) {
        store.setState({
          getMiLightCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        miLightDevices: {
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
        miLightDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        miLightDeviceSearch: e.target.value
      });
      await actions.getMiLightDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getMiLightDeviceOrderDir: e.target.value
      });
      await actions.getMiLightDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
