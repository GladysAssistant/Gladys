import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getRflinkDevices(state) {
      store.setState({
        getrflinkDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'rflink',
          order_dir: state.getRflinkDeviceOrderDir || 'asc',
          take: 10000,
          skip: 0
        };
        if (state.rflinkDeviceSearch && state.rflinkDeviceSearch.length) {
          options.search = state.rflinkDeviceSearch;
        }
        const rflinkDevices = await state.httpClient.get('/api/v1/service/rflink/device', options);
        const rflinkDevicesMap = new Map();
        rflinkDevices.forEach(device => rflinkDevicesMap.set(device.external_id, device));
        store.setState({
          rflinkDevices,
          rflinkDevicesMap,
          getRflinkDevicesStatus: RequestStatus.Success
        });
        actions.getRflinkNewDevices(store.getState());
      } catch (e) {
        store.setState({
          getRflinkDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getRflinkNewDevices(state) {
      store.setState({
        getRflinkNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const rflinkNewDevices = await state.httpClient.get('/api/v1/service/philips-hue/devices');
        const rflinkNewDevicesFiltered = rflinkNewDevices.filter(device => {
          if (!state.rflinkDevicesMap) {
            return true;
          }
          return !state.rflinkDevicesMap.has(device.external_id);
        });
        store.setState({
          rflinkNewDevices: rflinkNewDevicesFiltered,
          getRflinkNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getRflinkNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        rflinkDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getRflinkCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getRflinkCreateDeviceStatus: RequestStatus.Success
        });
        actions.getRflinkDevices(store.getState());
      } catch (e) {
        store.setState({
          getRflinkCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        rflinkDevices: {
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
        rflinkDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        rflinkDeviceSearch: e.target.value
      });
      await actions.getRflinkDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getRflinkDeviceOrderDir: e.target.value
      });
      await actions.getRflinkDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
