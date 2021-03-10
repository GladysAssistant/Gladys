import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const actions = {
    async loadProps(state) {
      // Before loading the page that calls this function, we retrieve the following data:
      let netatmoUsername;
      let netatmoPassword;
      let netatmoClientId;
      let netatmoClientSecret;
      let netatmoIsConnect;
      try {
        try {
          // We are trying to recover the Username
          netatmoUsername = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_USERNAME');
        } catch (e) {
          store.setState({
            netatmoUsername: (netatmoUsername || {}).value,
            netatmoPassword,
            netatmoConnectStatus: RequestStatus.ServiceNotConfigured
          });
        }

        try {
          // We are trying to recover the Username
          netatmoClientId = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID');
        } catch (e) {
          store.setState({
            netatmoClientId: (netatmoClientId || {}).value,
            netatmoClientSecret,
            netatmoConnectStatus: RequestStatus.ServiceNotConfigured
          });
        }
        netatmoIsConnect = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT');
        if (netatmoUsername.value) {
          netatmoPassword = '*********'; // need to fill the field
        }
        if (netatmoClientId.value) {
          netatmoClientSecret = '*********'; // need to fill the field
          if (netatmoIsConnect.value === 'connect') {
            await store.setState({
              netatmoConnectStatus: RequestStatus.ServiceConnected,
              netatmoConnected: true
            });
          } else {
            await store.setState({
              netatmoConnectStatus: RequestStatus.ServiceDisconnected,
              netatmoConnected: false
            });
          }
        } else {
          store.setState({
            netatmoConnectStatus: RequestStatus.ServiceNotConfigured,
            netatmoConnected: false
          });
        }
      } catch (e) {
        await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
        store.setState({
          netatmoConnectStatus: RequestStatus.ServiceNotConfigured
        });
      } finally {
        store.setState({
          netatmoUsername: (netatmoUsername || {}).value,
          netatmoPassword,
          passwordChanges: false,
          netatmoClientId: (netatmoClientId || {}).value,
          netatmoClientSecret,
          clientSecretChanges: false
        });
      }
    },

    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        deviceFeaturet: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },

    async search(state, e) {
      store.setState({
        netatmoDeviceSearch: e.target.value
      });
      await actions.getNetatmoDevices(store.getState());
    },

    async changeOrderDir(state, e) {
      store.setState({
        getNetatmoDeviceOrderDir: e.target.value
      });
      await actions.getNetatmoDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, actions);
};

export default createActions;
