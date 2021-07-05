import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getYeelightDevices(state) {
      store.setState({
        getYeelightDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'yeelight',
          order_dir: state.getYeelightDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };
        if (state.yeelightDeviceSearch && state.yeelightDeviceSearch.length) {
          options.search = state.yeelightDeviceSearch;
        }
        const yeelightDevices = await state.httpClient.get('/api/v1/service/yeelight/device', options);
        const yeelightDevicesMap = new Map();
        yeelightDevices.forEach(device => yeelightDevicesMap.set(device.external_id, device));
        store.setState({
          yeelightDevices,
          yeelightDevicesMap,
          getYeelightDevicesStatus: RequestStatus.Success
        });
        actions.getYeelightNewDevices(store.getState());
      } catch (e) {
        store.setState({
          getYeelightDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getYeelightNewDevices(state) {
      store.setState({
        getYeelightNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const yeelightDevices = await state.httpClient.get('/api/v1/service/yeelight/scan');
        const yeelightNewDevices = yeelightDevices.filter(device => {
          if (!state.yeelightDevicesMap) {
            return true;
          }
          return !state.yeelightDevicesMap.has(device.external_id);
        });
        store.setState({
          yeelightNewDevices,
          getYeelightNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getYeelightNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        yeelightDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getYeelightCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getYeelightCreateDeviceStatus: RequestStatus.Success
        });
        actions.getYeelightDevices(store.getState());
      } catch (e) {
        store.setState({
          getYeelightCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        yeelightDevices: {
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
        yeelightDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
      actions.getYeelightDevices(store.getState());
    },
    async search(state, e) {
      store.setState({
        yeelightDeviceSearch: e.target.value
      });
      await actions.getYeelightDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getYeelightDeviceOrderDir: e.target.value
      });
      await actions.getYeelightDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
