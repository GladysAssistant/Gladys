const CONFIGURATION = {
  Z2M_DRIVER_PATH: 'ZIGBEE2MQTT_DRIVER_PATH',
  Z2M_BACKUP: 'Z2M_BACKUP',
  ZIGBEE_DONGLE_NAME: 'ZIGBEE_DONGLE_NAME',
  MQTT_URL_KEY: 'Z2M_MQTT_URL',
  MQTT_URL_VALUE: 'mqtt://localhost:1884',

  DOCKER_NODE_RED_VERSION: 'DOCKER_NODE_RED_VERSION', // Variable to identify last version of NodeRed docker file is installed
};

const DEFAULT = {
  DOCKER_NODE_RED_VERSION: '2 ', // Last version of NodeRed docker file,

};

module.exports = {
  CONFIGURATION,
  DEFAULT,
};
