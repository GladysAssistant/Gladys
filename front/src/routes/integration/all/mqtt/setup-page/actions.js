import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let configuration;
      try {
        configuration = await state.httpClient.get('/api/v1/service/mqtt/config');
      } finally {
        store.setState({
          mqttURL: configuration.mqttURL,
          mqttUsername: configuration.mqttUsername,
          mqttPassword: configuration.mqttPassword,
          useEmbeddedBroker: configuration.useEmbeddedBroker,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'mqttPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectMqttStatus: RequestStatus.Getting,
        mqttConnected: false,
        mqttConnectionError: undefined
      });
      try {
        const { mqttUrl, mqttUsername, mqttPassword } = state;
        await state.httpClient.post(`/api/v1/service/mqtt/connect`, {
          mqttUrl,
          mqttUsername,
          mqttPassword
        });

        store.setState({
          connectMqttStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ connectMqttStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          connectMqttStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage(state) {
      // display 3 seconds a message "MQTT connected"
      store.setState({
        mqttConnected: true,
        mqttConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            mqttConnected: false,
            connectMqttStatus: undefined
          }),
        3000
      );
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
