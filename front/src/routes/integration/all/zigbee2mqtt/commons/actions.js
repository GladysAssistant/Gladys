const createActions = store => {
  const actions = {
    async checkStatus(state) {
      let zigbee2mqttStatus = {
        usbConfigured: false,
        mqttConnected: false
      };
      try {
        zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      } finally {
        store.setState({
          zigbee2mqttStatusUsbConfigured: zigbee2mqttStatus.usbConfigured,
          zigbee2mqttStatusMqttConnected: zigbee2mqttStatus.mqttConnected
        });
      }
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
