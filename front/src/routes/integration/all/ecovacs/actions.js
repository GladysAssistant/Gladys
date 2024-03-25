import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

const HIDDEN_PASSWORD = '*********';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let configuration = {};
      try {
        configuration = await state.httpClient.get('/api/v1/service/ecovacs/config');
      } finally {
        store.setState({
          ecovacsUsername: configuration.login,
          ecovacsCountryCode: configuration.countryCode,
          ecovacsPassword: configuration.login && HIDDEN_PASSWORD,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'ecovacsPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectEcovacsStatus: RequestStatus.Getting,
        ecovacsConnected: false,
        ecovacsConnectionError: undefined
      });
      try {
        const { ecovacsUsername, ecovacsCountryCode, ecovacsPassword } = state;
        await state.httpClient.post('/api/v1/service/ecovacs/config', {
          accountId: ecovacsUsername,
          countryCode: ecovacsCountryCode,
          password: (state.passwordChanges && ecovacsPassword) || undefined
        });
        await state.httpClient.get(`/api/v1/service/ecovacs/connect`);

        store.setState({
          connectEcovacsStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ connectEcovacsStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          connectEcovacsStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "Ecovacs connected"
      store.setState({
        ecovacsConnected: true,
        ecovacsConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            ecovacsConnected: false,
            connectEcovacsStatus: undefined
          }),
        3000
      );
    },
    displayEcovacsError(state, error) {
      store.setState({
        ecovacsConnected: false,
        connectEcovacsStatus: undefined,
        ecovacsConnectionError: error
      });
    },
    async getEcovacsDevices(state) {
      store.setState({
        getEcovacsDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: 'asc'
        };
        if (state.ecovacsSearch && state.ecovacsSearch.length) {
          options.search = state.ecovacsSearch;
        }
        const ecovacsDevices = await state.httpClient.get('/api/v1/service/ecovacs/device', options);
        store.setState({
          ecovacsDevices,
          getEcovacsDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getEcovacsDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getDiscoveredEcovacsDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/ecovacs/discover');
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
    async getEcovacsDeviceStatus(state, device) {
      store.setState({
        loading: true
      });
      try {
        const status = await state.httpClient.get(`/api/v1/service/ecovacs/${device.selector}/status`);
        store.setState({
          status,
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
      const device = state.ecovacsDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const ecovacsDevices = update(state.ecovacsDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        ecovacsDevices
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
