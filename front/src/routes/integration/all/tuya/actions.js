import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsIntegration from '../../../../actions/integration';

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

    async getDiscoveredDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/tuya/discover');
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
        console.log(discoveredDevices);
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },

    async getTuyaDevices(state) {
      store.setState({
        getTuyaStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getTuyaOrderDir || 'asc'
        };
        if (state.tuyaSearch && state.tuyaSearch.length) {
          options.search = state.tuyaSearch;
        }

        const tuyaDevices = await state.httpClient.get('/api/v1/service/tuya/device', options);
        store.setState({
          tuyaDevices,
          getTuyaStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getTuyaStatus: e.message
        });
      }
    },

    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      store.setState(data);
    },

    async getTuyaConfiguration(state) {
      let tuyaBaseUrl = '';
      let tuyaAccessKey = '';
      let tuyaSecretKey = '';

      store.setState({
        tuyaGetSettingsStatus: RequestStatus.Getting,
        tuyaBaseUrl,
        tuyaAccessKey,
        tuyaSecretKey
      });
      try {
        const { value: url } = await state.httpClient.get('/api/v1/service/tuya/variable/BASE_URL');
        tuyaBaseUrl = url;

        const { value: accessKey } = await state.httpClient.get('/api/v1/service/tuya/variable/ACCESS_KEY');
        tuyaAccessKey = accessKey;

        const { value: secretKey } = await state.httpClient.get('/api/v1/service/tuya/variable/SECRET_KEY');
        tuyaSecretKey = secretKey;

        store.setState({
          tuyaGetSettingsStatus: RequestStatus.Success,
          tuyaBaseUrl,
          tuyaAccessKey,
          tuyaSecretKey
        });
      } catch (e) {
        store.setState({
          tuyaGetSettingsStatus: RequestStatus.Error
        });
      }
    },

    async saveTuyaConfiguration(state, e) {
      e.preventDefault();
      store.setState({
        tuyaSaveSettingsStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/tuya/variable/BASE_URL', {
          value: state.tuyaBaseUrl.trim()
        });

        await state.httpClient.post('/api/v1/service/tuya/variable/ACCESS_KEY', {
          value: state.tuyaAccessKey.trim()
        });

        await state.httpClient.post('/api/v1/service/tuya/variable/SECRET_KEY', {
          value: state.tuyaSecretKey.trim()
        });

        // start service
        await state.httpClient.post('/api/v1/service/tuya/start');
        store.setState({
          tuyaSaveSettingsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          tuyaSaveSettingsStatus: RequestStatus.Error
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
      const device = state.tuyaDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const tuyaDevices = update(state.tuyaDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        tuyaDevices
      });
    },

    async search(state, e) {
      store.setState({
        tuyaSearch: e.target.value
      });
      await actions.getTuyaDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getTuyaOrderDir: e.target.value
      });
      await actions.getTuyaDevices(store.getState());
    }
  };

  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, integrationActions, actions);
}

export default createActions;
