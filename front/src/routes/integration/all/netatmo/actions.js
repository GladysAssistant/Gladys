import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import { RequestStatus } from '../../../../utils/consts';

const createActions = store => {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
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

    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'netatmoPassword') {
        data.passwordChanges = true;
      }
      if (e.target.name === 'netatmoClientSecret') {
        data.clientSecretChanges = true;
      }
      store.setState(data);
    },

    async saveConfiguration(state) {
      event.preventDefault();
      if (state.netatmoConnectStatus !== RequestStatus.ServiceConnected) {
        // During the connection time, we report that Gladys is being connected and that she is not yet connected.
        store.setState({
          netatmoConnectStatus: RequestStatus.Getting,
          netatmoConnected: false
        });
        try {
          // We register the username in the database.
          await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_USERNAME', {
            value: state.netatmoUsername
          });
          // If a password change is reported
          if (state.passwordChanges) {
            // If the password is not filled in
            if (state.netatmoPassword === '') {
              // It indicates that Gladys is disconnected from Netatmo.
              await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
              store.setState({
                netatmoConnectStatus: RequestStatus.ServiceNotConfigured
              });
              // And an empty password is entered in the database.
              await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_PASSWORD', {
                value: ''
              });
            } else {
              // Otherwise we register the password in the database.
              await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_PASSWORD', {
                value: state.netatmoPassword
              });
            }
          }
          // If the clientId is not filled in
          if (state.netatmoClientId === '') {
            // It indicates that Gladys is disconnected from Netatmo.
            await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
            store.setState({
              netatmoConnectStatus: RequestStatus.ServiceNotConfigured
            });
            // And an empty clientId is entered in the database.
            await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID', {
              value: ''
            });
          } else {
            // Otherwise we register the clientId in the database.
            await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID', {
              value: state.netatmoClientId
            });
          }
          // If a clientSecret change is reported
          if (state.clientSecretChanges) {
            // If the clientSecret is not filled in
            if (state.netatmoClientSecret === '') {
              // It indicates that Gladys is disconnected from Netatmo.
              await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
              store.setState({
                netatmoConnectStatus: RequestStatus.ServiceNotConfigured
              });
              // And an empty clientSecret is entered in the database.
              await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_SECRET', {
                value: ''
              });
            } else {
              // Otherwise we register the clientSecret in the database.
              await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_SECRET', {
                value: state.netatmoClientSecret
              });
            }
          }
          // If everything went well, we report that the user asks to log in.
          await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT', { value: 'connect' });
          // And we are trying to connect Gladys to the Netatmo API.
          await state.httpClient.post(`/api/v1/service/netatmo/connect`);
        } catch (e) {
          // If an error occurs during the backup and the connection attempt, we point out that Gladys must remain disconnected.
          await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
          store.setState({
            netatmoConnectStatus: RequestStatus.Error
          });
        } finally {
          // In any case, we point out that there is no more change of password or clientSecret requested.
          store.setState({
            passwordChanges: false,
            clientSecretChanges: false
          });
        }
      }
    },

    async disconnectAction(state) {
      event.preventDefault();
      store.setState({
        netatmoConnectStatus: RequestStatus.ServiceDisconnected,
        netatmoConnected: false
      });
      try {
        await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
        store.setState({
          netatmoConnectStatus: RequestStatus.ServiceDisconnected,
          netatmoConnected: false
        });
      } catch (e) {
        store.setState({
          netatmoConnectStatus: RequestStatus.Error,
          passwordChanges: false,
          clientSecretChanges: false
        });
      }
    },

    displayConnectedMessage(state) {
      store.setState({
        netatmoConnectedMessage: true,
        netatmoConnectedError: false,
        netatmoConnectionError: undefined,
        netatmoConnectStatus: RequestStatus.ServiceConnected,
        netatmoConnected: true
      });
    },

    displayDisconnectedMessage(state) {
      store.setState({
        netatmoConnectedMessage: true,
        netatmoConnectedError: false,
        netatmoConnectionError: undefined,
        netatmoConnectStatus: RequestStatus.ServiceDisconnected,
        netatmoConnected: false
      });
    },

    displayNetatmoError(state) {
      store.setState({
        netatmoConnectedMessage: false,
        netatmoConnectedError: true
      });
    },

    displayNetatmoErrorData(state) {
      store.setState({
        netatmoConnectedErrorDatz: true
      });
    },

    async refreshDevice(state) {
      store.setState({
        getNetatmoDeviceSensorsStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.get('/api/v1/service/netatmo/refresh_device');
        await actions.getNetatmoDeviceSensors(state);
        store.setState({
          getNetatmoDeviceSensorsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getNetatmoDeviceSensorsStatus: RequestStatus.Error
        });
      }
    },

    async getNetatmoDeviceSensors(state) {
      store.setState({
        getNetatmoDeviceSensorsStatus: RequestStatus.Getting
      });
      try {
        const netatmoSensorsDiscover = await state.httpClient.get('/api/v1/service/netatmo/sensor');
        const netatmoDevice = await state.httpClient.get('/api/v1/service/netatmo/device');
        const netatmoSensors = [];

        let keyNetatmoSensorsDiscover = 0;
        netatmoSensorsDiscover.forEach(sensor => {
          const indexNetatmoSensorsFiltered = netatmoDevice.findIndex(
            element => element.external_id === sensor.external_id
          );
          if (indexNetatmoSensorsFiltered !== -1) {
            netatmoSensorsDiscover[keyNetatmoSensorsDiscover].not_handled = true;
          } else {
            netatmoSensorsDiscover[keyNetatmoSensorsDiscover].not_handled = false;
            netatmoSensors[netatmoSensors.length] = netatmoSensorsDiscover[keyNetatmoSensorsDiscover];
          }
          keyNetatmoSensorsDiscover = keyNetatmoSensorsDiscover + 1;
        });
        keyNetatmoSensorsDiscover = 0;
        netatmoSensorsDiscover.forEach(sensor => {
          const indexNetatmoSensorsFiltered = netatmoSensors.findIndex(
            element => element.external_id === sensor.external_id
          );
          if (indexNetatmoSensorsFiltered === -1) {
            netatmoSensors[netatmoSensors.length] = netatmoSensorsDiscover[keyNetatmoSensorsDiscover];
          }
          keyNetatmoSensorsDiscover = keyNetatmoSensorsDiscover + 1;
        });
        if (netatmoSensors[0]) {
          store.setState({
            netatmoSensors,
            getNetatmoDeviceSensorsStatus: RequestStatus.Success
          });
        } else {
          store.setState({
            getNetatmoDeviceSensorsStatus: RequestStatus.ConnectedNoDevice
          });
        }
      } catch (e) {
        store.setState({
          getNetatmoDeviceSensorsStatus: RequestStatus.Error
        });
      }
    },

    async createDevice(state, device, sensorIndex) {
      await state.httpClient.post('/api/v1/device', device);
      const newState = update(store.getState(), {
        netatmoSensors: {
          [sensorIndex]: {
            not_handled: {
              $set: true
            }
          }
        }
      });
      store.setState(newState);
    },

    async getNetatmoSensors(state) {
      store.setState({
        getNetatmoSensorsStatus: RequestStatus.Getting
      });
      try {
        const netatmoSensors = await state.httpClient.get('/api/v1/service/netatmo/sensor');

        const netatmoSensorsFiltered = netatmoSensors.filter(sensor => {
          if (!state.netatmoDevicesMap) {
            return true;
          }
          return !state.netatmoDevicesMap.has(sensor.external_id);
        });
        store.setState({
          netatmoSensors: netatmoSensorsFiltered,
          getNetatmoSensorsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getNetatmoSensorsStatus: RequestStatus.Error
        });
      }
    },

    async getNetatmoDevices(state) {
      store.setState({
        getNetatmoDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getNetatmoDeviceOrderDir || 'asc'
        };
        if (state.netatmoDeviceSearch && state.netatmoDeviceSearch.length) {
          options.search = state.netatmoDeviceSearch;
        }
        const netatmoDevices = await state.httpClient.get('/api/v1/service/netatmo/device', options);
        const netatmoDevicesMap = new Map();
        netatmoDevices.forEach(netatmoDevice => {
          netatmoDevicesMap.set(netatmoDevice.external_id, netatmoDevice);
        });
        store.setState({
          netatmoDevices,
          netatmoDevicesMap,
          getNetatmoDevicesStatus: RequestStatus.Success
        });
        actions.getNetatmoSensors(store.getState());
      } catch (e) {
        store.setState({
          getNetatmoDevicesStatus: RequestStatus.Error
        });
      }
    },

    async saveDevice(state, device) {
      await state.httpClient.post('/api/v1/device', device);
    },

    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        netatmoDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },

    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        netatmoDevices: {
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
  return Object.assign({}, houseActions, integrationActions, actions);
};

export default createActions;
