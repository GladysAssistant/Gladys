import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getConfiguration(state) {
      store.setState({
        overkizGetConfigurationStatus: RequestStatus.Getting
      });
      try {
        const configuration = await state.httpClient.get('/api/v1/service/overkiz/configuration');
        store.setState({
          overkizGetConfigurationStatus: RequestStatus.Success,
          ...configuration
        });
      } catch (e) {
        store.setState({
          overkizGetConfigurationStatus: RequestStatus.Error
        });
      }
    },
    updateConfiguration(state, configuration) {
      store.setState(configuration);
    },
    async connect(state) {
      await actions.disconnect(state);
      await actions.saveConfiguration(state);
      store.setState({
        overkizConnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/overkiz/connect');
        await actions.getStatus(store.getState());
        store.setState({
          overkizConnectStatus: RequestStatus.Success,
          overkizConnectionInProgress: true
        });
      } catch (e) {
        store.setState({
          overkizConnectStatus: RequestStatus.Error
        });
      }
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        saveConfigurationStatus: RequestStatus.Getting
      });

      const { overkizType, overkizUsername, overkizPassword } = state;
      try {
        await state.httpClient.post(`/api/v1/service/overkiz/configuration`, {
          overkizType,
          overkizUsername,
          overkizPassword
        });

        store.setState({
          saveConfigurationStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          saveConfigurationStatus: RequestStatus.Error
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "Overkiz connected"
      store.setState({
        overkizConnected: true,
        overkizConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            overkizConnected: false,
            connectOverkizStatus: undefined
          }),
        3000
      );
    },
    displayOverkizError(state, error) {
      store.setState({
        overkizConnected: false,
        connectOverkizStatus: undefined,
        overkizConnectionError: error
      });
    },
    async getOverkizDevices(state) {
      store.setState({
        getOverkizStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getOverkizOrderDir || 'asc'
        };
        if (state.overkizSearch && state.overkizSearch.length) {
          options.search = state.overkizSearch;
        }

        const overkizDevices = await state.httpClient.get('/api/v1/service/overkiz/device', options);
        store.setState({
          overkizDevices,
          getOverkizStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getOverkizStatus: e.message
        });
      }
    },
    async getDiscoveredOverkizDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/overkiz/discover');
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
    async discoverOverkizDevices(state) {
      store.setState({
        loading: true
      });
      try {
        await state.httpClient.post('/api/v1/service/overkiz/discover');
        const discoveredDevices = await state.httpClient.get('/api/v1/service/overkiz/discover');
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
      const device = state.overkizDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const overkizDevices = update(state.overkizDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        overkizDevices
      });
    },
    async search(state, e) {
      store.setState({
        overkizSearch: e.target.value
      });
      await actions.getOverkizDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getOverkizOrderDir: e.target.value
      });
      await actions.getOverkizDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
