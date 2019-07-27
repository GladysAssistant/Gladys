import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
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
        await state.httpClient.post('/api/v1/service/mqtt/variable/MQTT_PASSWORD', {
          value: state.mqttPassword
        });
        await state.httpClient.post(`/api/v1/service/mqtt/connect`);

        store.setState({
          connectMqttStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectMqttStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
