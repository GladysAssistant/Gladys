import createActionsIntegration from '../../../../actions/integration';
import { RequestStatus } from '../../../../utils/consts';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      store.setState({
        influxdbGetSettingsStatus: RequestStatus.Getting
      });
      let configuration = {};
      try {
        configuration = await state.httpClient.get('/api/v1/service/influxdb/config');
      } finally {
        store.setState({
          influxdbUrl: configuration.influxdbUrl,
          influxdbBucket: configuration.influxdbBucket,
          influxdbToken: configuration.influxdbToken,
          influxdbOrg: configuration.influxdbOrg,
          influxdbGetSettingsStatus: RequestStatus.Success
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
        const { influxdbUrl, influxdbBucket, influxdbToken, influxdbOrg } = state;
        await state.httpClient.post(`/api/v1/service/influxdb/saveConfig`, {
          influxdbUrl,
          influxdbBucket,
          influxdbToken,
          influxdbOrg
        });
      } catch (e) {
        store.setState({
          connectMqttStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    async testConnection(state) {
      store.setState({
        connectInfluxdbStatus: RequestStatus.Getting,
      });
      const { influxdbUrl, influxdbBucket, influxdbToken, influxdbOrg } = state;
      const connectionStatus = await state.httpClient.post(`/api/v1/service/influxdb/test`, state);
      
    },
  };

  return Object.assign({}, actions, integrationActions);
}

export default createActions;
