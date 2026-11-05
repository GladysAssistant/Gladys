// The status fields read by the Zigbee2mqtt pages, kept in the store so that the status banner and
// the permit join switch always show the same state
const toStoreState = zigbee2mqttStatus => ({
  usbConfigured: zigbee2mqttStatus.usbConfigured,
  z2mEnabled: zigbee2mqttStatus.z2mEnabled,
  gladysConnected: zigbee2mqttStatus.gladysConnected,
  zigbee2mqttConnected: zigbee2mqttStatus.zigbee2mqttConnected,
  zigbee2mqttExist: zigbee2mqttStatus.zigbee2mqttExist,
  z2mContainerError: zigbee2mqttStatus.z2mContainerError,
  mqttConnectionError: zigbee2mqttStatus.mqttConnectionError
});

// Incremented by each status request and each live status: an HTTP answer is kept only if nothing newer happened
// while it was pending (a live status, or another request when the page is left and opened again)
let statusVersion = 0;

const createActions = store => {
  const actions = {
    async checkStatus(state) {
      statusVersion += 1;
      const requestVersion = statusVersion;
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
        if (requestVersion === statusVersion) {
          store.setState(toStoreState(zigbee2mqttStatus));
        }
      }
    },
    updateStatus(state, zigbee2mqttStatus) {
      statusVersion += 1;
      store.setState(toStoreState(zigbee2mqttStatus));
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
