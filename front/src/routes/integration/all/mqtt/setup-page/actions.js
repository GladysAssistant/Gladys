import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      const mqttURL = await state.httpClient.get('/api/v1/service/mqtt/variable/MQTT_URL');
      const mqttUsername = await state.httpClient.get('/api/v1/service/mqtt/variable/MQTT_USERNAME');
      const mqttTopics = await state.httpClient.get('/api/v1/service/mqtt/variable/MQTT_TOPICS');

      store.setState({
        mqttURL: (mqttURL || {}).value,
        mqttUsername: (mqttUsername || {}).value,
        mqttTopics: ((mqttTopics || {}).value || '').split(',')
      });
    },
    prepareTopic(state, e) {
      const topic = e.target.value;
      store.setState({
        currentTopic: topic
      });
    },
    addTopic(state, e) {
      e.preventDefault();

      const topic = state.currentTopic;

      if (!topic) {
        store.setState({
          currentTopicStatus: 'empty'
        });
      } else {
        const mqttTopics = (state.mqttTopics || []).slice();
        if (mqttTopics.includes(topic)) {
          store.setState({
            currentTopicStatus: 'duplicate'
          });
        } else {
          mqttTopics.push(topic);
          store.setState({
            mqttTopics,
            currentTopicStatus: 'success',
            currentTopic: undefined
          });
        }
      }
    },
    removeTopic(state, index) {
      const mqttTopics = state.mqttTopics.slice();
      mqttTopics.splice(index, 1);
      store.setState({
        mqttTopics
      });
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'mqttPawword') {
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
        await state.httpClient.post('/api/v1/service/mqtt/variable/MQTT_TOPICS', {
          value: state.mqttTopics.join(',')
        });
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
