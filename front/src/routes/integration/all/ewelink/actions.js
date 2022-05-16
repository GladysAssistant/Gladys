import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let eweLinkUsername;
      let eweLinkPassword;
      try {
        eweLinkUsername = await state.httpClient.get('/api/v1/service/ewelink/variable/EWELINK_EMAIL');
        if (eweLinkUsername.value) {
          eweLinkPassword = '*********'; // this is just used so that the field is filled
        }
      } finally {
        store.setState({
          eweLinkUsername: (eweLinkUsername || { value: '' }).value,
          eweLinkPassword,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'eweLinkPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectEweLinkStatus: RequestStatus.Getting,
        eweLinkConnected: false,
        eweLinkConnectionError: undefined
      });
      try {
        await state.httpClient.post('/api/v1/service/ewelink/variable/EWELINK_EMAIL', {
          value: state.eweLinkUsername
        });
        if (state.passwordChanges) {
          await state.httpClient.post('/api/v1/service/ewelink/variable/EWELINK_PASSWORD', {
            value: state.eweLinkPassword
          });
        }
        await state.httpClient.post(`/api/v1/service/ewelink/connect`);

        store.setState({
          connectEweLinkStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ connectEweLinkStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          connectEweLinkStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "EweLink connected"
      store.setState({
        eweLinkConnected: true,
        eweLinkConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            eweLinkConnected: false,
            connectEweLinkStatus: undefined
          }),
        3000
      );
    },
    displayEweLinkError(state, error) {
      store.setState({
        eweLinkConnected: false,
        connectEweLinkStatus: undefined,
        eweLinkConnectionError: error
      });
    },
    async getEweLinkDevices(state) {
      store.setState({
        getEweLinkStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getEweLinkOrderDir || 'asc'
        };
        if (state.eweLinkSearch && state.eweLinkSearch.length) {
          options.search = state.eweLinkSearch;
        }

        const eweLinkDevices = await state.httpClient.get('/api/v1/service/ewelink/device', options);
        store.setState({
          eweLinkDevices,
          getEweLinkStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getEweLinkStatus: e.message
        });
      }
    },
    async getDiscoveredEweLinkDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/ewelink/discover');
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
      const device = state.eweLinkDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const eweLinkDevices = update(state.eweLinkDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        eweLinkDevices
      });
    },
    async search(state, e) {
      store.setState({
        eweLinkSearch: e.target.value
      });
      await actions.getEweLinkDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getEweLinkOrderDir: e.target.value
      });
      await actions.getEweLinkDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
