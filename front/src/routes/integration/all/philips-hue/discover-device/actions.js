import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import { BRIDGE_MODEL } from '../../../../../../../server/services/philips-hue/lib/utils/consts';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getPhilipsHueDevices(state) {
      store.setState({
        getPhilipsHueDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getPhilipsHueDeviceOrderDir || 'asc'
        };
        if (state.philipsHueDeviceSearch && state.philipsHueDeviceSearch.length) {
          options.search = state.philipsHueDeviceSearch;
        }
        const philipsHueDevicesReceived = await state.httpClient.get('/api/v1/service/philips-hue/device', options);
        const philipsHueDevices = philipsHueDevicesReceived.filter(device => device.model !== BRIDGE_MODEL);
        const philipsHueDevicesMap = new Map();
        philipsHueDevices.forEach(device => philipsHueDevicesMap.set(device.external_id, device));
        store.setState({
          philipsHueDevices,
          philipsHueDevicesMap,
          getPhilipsHueDevicesStatus: RequestStatus.Success
        });
        actions.getPhilipsHueNewDevices(store.getState());
      } catch (e) {
        store.setState({
          getPhilipsHueDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getPhilipsHueNewDevices(state) {
      store.setState({
        getPhilipsHueNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const philipsHueNewDevices = await state.httpClient.get('/api/v1/service/philips-hue/light');
        const philipsHueNewDevicesFiltered = philipsHueNewDevices.filter(device => {
          if (!state.philipsHueDevicesMap) {
            return true;
          }
          return !state.philipsHueDevicesMap.has(device.external_id);
        });
        store.setState({
          philipsHueNewDevices: philipsHueNewDevicesFiltered,
          getPhilipsHueNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getPhilipsHueNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        philipsHueDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getPhilipsHueCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getPhilipsHueCreateDeviceStatus: RequestStatus.Success
        });
        actions.getPhilipsHueDevices(store.getState());
      } catch (e) {
        store.setState({
          getPhilipsHueCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        philipsHueDevices: {
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
        philipsHueDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        philipsHueDeviceSearch: e.target.value
      });
      await actions.getPhilipsHueDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getPhilipsHueDeviceOrderDir: e.target.value
      });
      await actions.getPhilipsHueDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
