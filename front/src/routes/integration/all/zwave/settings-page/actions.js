import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getUsbPorts(state) {
      store.setState({
        getZwaveUsbPortStatus: RequestStatus.Getting
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getZwaveUsbPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getZwaveUsbPortStatus: RequestStatus.Error
        });
      }
    },
    async getConfiguration(state) {
      store.setState({
        getConfigurationStatus: RequestStatus.Getting
      });
      try {
        const configuration = await state.httpClient.get('/api/v1/service/zwave/configuration');
        store.setState({
          getConfigurationStatus: RequestStatus.Success,
          ...configuration
        });
      } catch (e) {
        store.setState({
          getConfigurationStatus: RequestStatus.Error
        });
      }
    },
    async getStatus(state) {
      store.setState({
        getStatusStatus: RequestStatus.Getting
      });
      try {
        const zwaveStatus = await state.httpClient.get('/api/v1/service/zwave/status');
        store.setState({
          getStatusStatus: RequestStatus.Success,
          ...zwaveStatus
        });
      } catch (e) {
        store.setState({
          getStatusStatus: RequestStatus.Error,
          zwaveConnectionInProgress: false
        });
      }
    },
    updateConfiguration(state, configuration) {
      store.setState(configuration);
    },
    async connect(state) {
      store.setState({
        zwaveConnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/connect');
        await actions.getStatus(store.getState());
        store.setState({
          zwaveConnectStatus: RequestStatus.Success,
          zwaveConnectionInProgress: true
        });
      } catch (e) {
        store.setState({
          zwaveConnectStatus: RequestStatus.Error
        });
      }
    },
    async disconnect(state) {
      store.setState({
        zwaveDisconnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          zwaveDisconnectStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveDisconnectStatus: RequestStatus.Error
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "MQTT connected"
      store.setState({
        zwaveConnected: true
      });
      setTimeout(
        () =>
          store.setState({
            zwaveConnected: false,
            connectMqttStatus: undefined
          }),
        3000
      );
    },
    displayMqttError(state, error) {
      store.setState({
        zwaveConnected: false,
        mqttConnectionError: error
      });
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        saveConfigurationStatus: RequestStatus.Getting
      });
      try {
        const { zwaveMode, zwaveDriverPath } = state;
        await state.httpClient.post(`/api/v1/service/zwave/configuration`, {
          zwaveMode,
          zwaveDriverPath
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
    driverFailed() {
      store.setState({
        zwaveDriverFailed: true,
        zwaveConnectionInProgress: false
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
