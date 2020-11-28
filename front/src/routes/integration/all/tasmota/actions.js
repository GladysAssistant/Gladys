import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getTasmotaDevices(state) {
      store.setState({
        getTasmotaStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getTasmotaOrderDir || 'asc'
        };
        if (state.tasmotaSearch && state.tasmotaSearch.length) {
          options.search = state.tasmotaSearch;
        }

        const tasmotaDevices = await state.httpClient.get('/api/v1/service/tasmota/device', options);
        store.setState({
          tasmotaDevices,
          getTasmotaStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          philipsHueGetBridgesStatus: RequestStatus.Error,
          getTasmotaStatus: e.message
        });
      }
    },
    async getDiscoveredTasmotaDevices(state, type) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get(`/api/v1/service/tasmota/discover/${type}`);
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
      } catch (e) {
        store.setState({
          discoveredDevices: undefined,
          loading: false,
          errorLoading: true
        });
      }
    },
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
    updateDeviceField(state, listName, index, field, value) {
      const devices = update(state[listName], {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        [listName]: devices
      });
    },
    updateFeatureProperty(state, listName, deviceIndex, featureIndex, property, value) {
      const devices = update(state[listName], {
        [deviceIndex]: {
          features: {
            [featureIndex]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });

      store.setState({
        [listName]: devices
      });
    },
    async saveDevice(state, listName, index) {
      const device = state[listName][index];
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const devices = update(state[listName], {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        [listName]: devices
      });
    },
    async deleteDevice(state, index) {
      const device = state.tasmotaDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const tasmotaDevices = update(state.tasmotaDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        tasmotaDevices
      });
    },
    async search(state, e) {
      store.setState({
        tasmotaSearch: e.target.value
      });
      await actions.getTasmotaDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getTasmotaOrderDir: e.target.value
      });
      await actions.getTasmotaDevices(store.getState());
    },
    async searchDevices(state, type, options = undefined) {
      store.setState({
        loading: true
      });
      try {
        await state.httpClient.post(`/api/v1/service/tasmota/discover/${type}`, options);
        store.setState({
          discoveredDevices: [],
          errorLoading: false
        });

        setTimeout(store.setState, 5000, {
          loading: false
        });
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },
    async connectAndScan(state, deviceIndex, username, password) {
      const device = state.discoveredDevices[deviceIndex];
      const options = {
        singleAddress: device.external_id.replace('tasmota:', ''),
        username,
        password
      };
      await state.httpClient.post('/api/v1/service/tasmota/discover/http', options);
    },
    addDiscoveredDevice(state, newDevice) {
      const existingDevices = state.discoveredDevices || [];
      const newDevices = [];

      let added = false;
      existingDevices.forEach(device => {
        if (device.external_id === newDevice.external_id) {
          newDevices.push(newDevice);
          added = true;
        } else {
          newDevices.push(device);
        }
      });

      if (!added) {
        newDevices.push(newDevice);
      }

      store.setState({
        discoveredDevices: newDevices,
        loading: false
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
