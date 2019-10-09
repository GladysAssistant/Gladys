const createActions = store => {
  const actions = {
    async checkStatus(state) {
      let mqttStatus = {
        configured: false,
        connected: false
      };
      try {
        mqttStatus = await state.httpClient.get('/api/v1/service/mqtt/status');
      } finally {
        store.setState({
          mqttStatusConfigured: mqttStatus.configured,
          mqttStatusConnected: mqttStatus.connected,
          mqttStatusLoaded: true
        });
      }
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
