const MQTT_MODE = {
  LOCAL: 'local',
  EXTERNAL: 'external'
};

const SETUP_MODES = {
  LOCAL: 'local',
  REMOTE: 'remote'
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

export { MQTT_MODE, SETUP_MODES, ADAPTER_MODE, isConfigured };
