import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let mqttURL;
      let mqttUsername;
      let mqttPassword;
      try {
        mqttURL = await state.httpClient.get('/api/v1/service/mqtt/variable/MQTT_URL');
        mqttUsername = await state.httpClient.get('/api/v1/service/mqtt/variable/MQTT_USERNAME');
        if (mqttUsername.value) {
          mqttPassword = "FAKE_PASSWORD";
        }
      } finally {
        store.setState({
          mqttURL: (mqttURL || {}).value,
          mqttUsername: (mqttUsername || {}).value,
          mqttPassword,
          passwordChanges: false
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
        connectMqttStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/mqtt/variable/MQTT_URL', {
          value: state.mqttURL
        });
        await state.httpClient.post('/api/v1/service/mqtt/variable/MQTT_USERNAME', {
          value: state.mqttUsername
        });
        if (state.passwordChanges) {
          await state.httpClient.post('/api/v1/service/mqtt/variable/MQTT_PASSWORD', {
            value: state.mqttPassword
          });
        }
        await state.httpClient.post(`/api/v1/service/mqtt/connect`);

        store.setState({
          connectMqttStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectMqttStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
