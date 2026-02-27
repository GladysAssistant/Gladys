const DEVICE_PARAM_NAME = {
  PROTOCOL: 'protocol',
  USERNAME: 'username',
  PASSWORD: 'password',
  IP: 'ip',
};

const DEVICE_PARAM_VALUE = {
  [DEVICE_PARAM_NAME.PROTOCOL]: {
    HTTP: 'http',
    MQTT: 'mqtt',
  },
};

module.exports = {
  DEVICE_PARAM_NAME,
  DEVICE_PARAM_VALUE,
};
