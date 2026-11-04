// The status fields read by the Zigbee2mqtt pages, kept in the store so that the status banner and
// the permit join switch always show the same state
const toStoreState = zigbee2mqttStatus => ({
  usbConfigured: zigbee2mqttStatus.usbConfigured,
  z2mEnabled: zigbee2mqttStatus.z2mEnabled,
  gladysConnected: zigbee2mqttStatus.gladysConnected,
  zigbee2mqttConnected: zigbee2mqttStatus.zigbee2mqttConnected,
  zigbee2mqttExist: zigbee2mqttStatus.zigbee2mqttExist,
  z2mContainerError: zigbee2mqttStatus.z2mContainerError
});

// Number of live statuses received by websocket: a status received while the HTTP request below is pending is
// newer than its answer, which must not overwrite it
let liveStatusCount = 0;

const createActions = store => {
  const actions = {
    async checkStatus(state) {
      const liveStatusCountAtRequest = liveStatusCount;
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
        if (liveStatusCount === liveStatusCountAtRequest) {
          store.setState(toStoreState(zigbee2mqttStatus));
        }
      }
    },
    updateStatus(state, zigbee2mqttStatus) {
      liveStatusCount += 1;
      store.setState(toStoreState(zigbee2mqttStatus));
    }
  };
  return Object.assign({}, actions);
};

export default createActions;
