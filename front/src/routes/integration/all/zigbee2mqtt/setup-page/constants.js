const MQTT_MODE = {
  LOCAL: 'local',
  EXTERNAL: 'external'
};

const ADAPTER_MODE = {
  USB: 'usb',
  NETWORK: 'network'
};

// A coordinator (USB dongle or network coordinator) or an external broker is saved: the setup page shows the
// installation, the wizard otherwise
const isConfigured = (configuration = {}) =>
  Boolean(
    configuration.z2mDriverPath || configuration.z2mNetworkAdapterUrl || configuration.mqttMode === MQTT_MODE.EXTERNAL
  );

// "Pair" waits this long for Zigbee2mqtt to tell that joining is allowed: told as failed after it
const PERMIT_JOIN_CONFIRM_TIMEOUT_IN_MS = 10000;

export { MQTT_MODE, ADAPTER_MODE, isConfigured, PERMIT_JOIN_CONFIRM_TIMEOUT_IN_MS };
