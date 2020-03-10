const createActions = store => {
  const actions = {
    async checkStatus(state) {
      let mqttStatus = {
        configured: false,
        connected: false
      };
      try {
        zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      } finally {
        store.setState({
          zigbee2mqttStatusConfigured: zigbee2mqttStatus.configured,
          zigbee2mqttStatusConnected: zigbee2mqttStatus.connected,
//          mqttStatusLoaded: true
        });
      }
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
