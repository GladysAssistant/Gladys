import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadStatus(state) {
      let mqttStatus = {
        connected: false
      };
      try {
        mqttStatus = await state.httpClient.get('/api/v1/service/mqtt/status');
      } finally {
        store.setState({
          mqttConnected: mqttStatus.connected
        });
      }
    },
    async loadProps(state) {
      let configuration = {};
      try {
        configuration = await state.httpClient.get('/api/v1/service/mqtt/config');
      } finally {
        store.setState({
          mqttUrl: configuration.mqttUrl,
          mqttUsername: configuration.mqttUsername,
          mqttPassword: configuration.mqttPassword,
          useEmbeddedBroker: configuration.useEmbeddedBroker,
          dockerBased: configuration.dockerBased,
          networkModeValid: configuration.networkModeValid,
          brokerContainerAvailable: configuration.brokerContainerAvailable,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfiguration(state, config) {
      store.setState(config);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectMqttStatus: RequestStatus.Getting,
        mqttConnected: false,
        mqttConnectionError: undefined
      });
      try {
        const { mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker } = state;
        await state.httpClient.post(`/api/v1/service/mqtt/connect`, {
          mqttUrl,
          mqttUsername,
          mqttPassword,
          useEmbeddedBroker
        });

        store.setState({
          connectMqttStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectMqttStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "MQTT connected"
      store.setState({
        mqttConnected: true,
        connectMqttStatus: undefined,
        mqttConnectionError: undefined
      });
    },
    displayMqttError(state, error) {
      store.setState({
        mqttConnected: false,
        connectMqttStatus: undefined,
        mqttConnectionError: error
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
