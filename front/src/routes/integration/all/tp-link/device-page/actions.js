import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getTpLinkDevices(state) {
      store.setState({
        getTpLinkDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getTpLinkDeviceOrderDir || 'asc'
        };
        if (state.tpLinkDeviceSearch && state.tpLinkDeviceSearch.length) {
          options.search = state.tpLinkDeviceSearch;
        }
        const tpLinkDevices = await state.httpClient.get('/api/v1/service/tp-link/device', options);
        const tpLinkDevicesMap = new Map();
        tpLinkDevices.forEach(device => tpLinkDevicesMap.set(device.external_id, device));
        store.setState({
          tpLinkDevices,
          tpLinkDevicesMap,
          getTpLinkDevicesStatus: RequestStatus.Success
        });
        actions.getTpLinkNewDevices(store.getState());
      } catch (e) {
        store.setState({
          getTpLinkDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getTpLinkNewDevices(state) {
      store.setState({
        getTpLinkNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const tpLinkNewDevices = await state.httpClient.get('/api/v1/service/tp-link/scan');
        const tpLinkNewDevicesFiltered = tpLinkNewDevices.filter(device => {
          if (!state.tpLinkDevicesMap) {
            return true;
          }
          return !state.tpLinkDevicesMap.has(device.external_id);
        });
        store.setState({
          tpLinkNewDevices: tpLinkNewDevicesFiltered,
          getTpLinkNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getTpLinkNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        tpLinkDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getTpLinkCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getTpLinkCreateDeviceStatus: RequestStatus.Success
        });
        actions.getTpLinkDevices(store.getState());
      } catch (e) {
        store.setState({
          getTpLinkCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        tpLinkDevices: {
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
        tpLinkDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        tpLinkDeviceSearch: e.target.value
      });
      await actions.getTpLinkDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getTpLinkDeviceOrderDir: e.target.value
      });
      await actions.getTpLinkDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
