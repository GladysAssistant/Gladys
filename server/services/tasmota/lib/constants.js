const DEVICE_PARAM_NAME = {
  USERNAME: 'username',
  PASSWORD: 'password',
  INTERFACE: 'interface',
};

const DEVICE_PARAM_VALUE = {
  [DEVICE_PARAM_NAME.INTERFACE]: {
    HTTP: 'http',
    MQTT: 'mqtt',
  },
};

module.exports = {
  DEVICE_PARAM_NAME,
  DEVICE_PARAM_VALUE,
};
