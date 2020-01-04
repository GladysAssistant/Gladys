import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getTasmotaDevices(state, take, skip) {
      store.setState({
        getTasmotaStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getTasmotaOrderDir || 'asc',
          take,
          skip
        };
        if (state.tasmotaSearch && state.tasmotaSearch.length) {
          options.search = state.tasmotaSearch;
        }

        const tasmotasReceived = await state.httpClient.get('/api/v1/service/tasmota/device', options);
        let tasmotaDevices;
        if (skip === 0) {
          tasmotaDevices = tasmotasReceived;
        } else {
          tasmotaDevices = update(state.tasmotaDevices, {
            $push: tasmotasReceived
          });
        }
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
    async getDiscoveredTasmotaDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/tasmota/discover');
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
      } catch (e) {
        store.setState({
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
      await actions.getTasmotaDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getTasmotaOrderDir: e.target.value
      });
      await actions.getTasmotaDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
