import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      try {
        const params = {
          expand: 'rooms'
        };
        const housesWithRooms = await state.httpClient.get(`/api/v1/house`, params);
        store.setState({
          housesWithRooms,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    async getBroadlinkRemotes(state) {
      store.setState({
        getBroadlinkDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getBroadlinkDeviceOrderDir || 'asc'
        };
        if (state.broadlinkDeviceSearch && state.broadlinkDeviceSearch.length) {
          options.search = state.broadlinkDeviceSearch;
        }
        const broadlinkDevices = await state.httpClient.get('/api/v1/service/broadlink/device', options);
        store.setState({
          broadlinkDevices,
          getBroadlinkDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          broadlinkDevices: [],
          getBroadlinkDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        broadlinkDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        broadlinkDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        broadlinkDeviceSearch: e.target.value
      });
      await actions.getBroadlinkRemotes(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getBroadlinkDeviceOrderDir: e.target.value
      });
      await actions.getBroadlinkRemotes(store.getState());
    },
    async getBroadlinkPeripherals(state) {
      try {
        const broadlinkPeripherals = await state.httpClient.get('/api/v1/service/broadlink/peripheral');
        store.setState({
          broadlinkPeripherals: broadlinkPeripherals.filter(p => p.canLearn)
        });
      } catch (e) {
        store.setState({
          broadlinkPeripherals: []
        });
      }
    },
    updateDeviceProperty(state, remoteIndex, property, value) {
      const broadlinkDevices = update(state.broadlinkDevices, {
        [remoteIndex]: {
          [property]: {
            $set: value
          }
        }
      });

      store.setState({
        broadlinkDevices
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, integrationActions, actions);
}

export default createActions;
