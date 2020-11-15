const createActions = store => {
  const actions = {
    async checkStatus(state) {
      let zigbee2mqttStatus = {
        usbConfigured: false,
        mqttExist: false,
        mqttRunning: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false,
        z2mEnabled: false
      };
      try {
        zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      } finally {
        store.setState({
          usbConfigured: zigbee2mqttStatus.usbConfigured,
          z2mEnabled: zigbee2mqttStatus.z2mEnabled
        });
      }
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
