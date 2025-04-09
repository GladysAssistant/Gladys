import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

const HIDDEN_API_KEY = '*********';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let configuration = {};
      try {
        configuration = await state.httpClient.get('/api/v1/service/nuki/config');
      } finally {
        store.setState({
          nukiApiKey: configuration.apiKey && HIDDEN_API_KEY,
          apiKeyChanges: false,
          connected: false
        });
      }
    },
    async getNukiDevices(state) {
      store.setState({
        getNukiStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getNukiOrderDir || 'asc'
        };
        if (state.nukiSearch && state.nukiSearch.length) {
          options.search = state.nukiSearch;
        }

        const nukiDevices = await state.httpClient.get('/api/v1/service/nuki/device', options);
        store.setState({
          nukiDevices,
          getNukiStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getNukiStatus: e.message
        });
      }
    },
    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'nukiApiKey') {
        data.apiKeyChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        nukiConnectionStatus: RequestStatus.Getting,
        nukiConnected: false,
        nukiConnectionError: undefined
      });
      try {
        const { nukiApiKey } = state;
        await state.httpClient.post('/api/v1/service/nuki/config', {
          apiKey: (state.apiKeyChanges && nukiApiKey) || undefined
        });
        await state.httpClient.get(`/api/v1/service/nuki/connect`);

        store.setState({
          nukiConnectionStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ nukiConnectionStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          nukiConnectionStatus: RequestStatus.Error,
          apiKeyChanges: false
        });
      }
    },
    async getDiscoveredNukiDevices(state, type) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get(`/api/v1/service/nuki/discover/${type}`);
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
    displayConnectedMessage() {
      // display 3 seconds a message "Nuki connected"
      store.setState({
        nukiConnected: true,
        nukiConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            nukiConnected: false,
            nukiConnectionStatus: undefined
          }),
        3000
      );
    },
    displayNukiError(state, error) {
      store.setState({
        nukiConnected: false,
        nukiConnectionStatus: undefined,
        nukiConnectionError: error
      });
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
      const device = state.nukiDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const nukiDevices = update(state.nukiDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        nukiDevices
      });
    },
    async search(state, e) {
      store.setState({
        nukiSearch: e.target.value
      });
      await actions.getNukiDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getNukiOrderDir: e.target.value
      });
      await actions.getNukiDevices(store.getState());
    },
    async searchDevices(state, type, options = undefined) {
      store.setState({
        loading: true
      });
      try {
        await state.httpClient.post(`/api/v1/service/nuki/discover/${type}`, options);
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

  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
