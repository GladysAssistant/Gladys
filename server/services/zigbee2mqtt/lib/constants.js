const CONFIGURATION = {
  Z2M_DRIVER_PATH: 'ZIGBEE2MQTT_DRIVER_PATH',
  Z2M_BACKUP: 'Z2M_BACKUP',
  MQTT_URL_KEY: 'Z2M_MQTT_URL',
  MQTT_URL_VALUE: 'mqtt://localhost:1884',
  Z2M_MQTT_USERNAME_KEY: 'Z2M_MQTT_USERNAME',
  Z2M_MQTT_USERNAME_VALUE: 'z2m',
  Z2M_MQTT_PASSWORD_KEY: 'Z2M_MQTT_PASSWORD',
  GLADYS_MQTT_USERNAME_KEY: 'GLADYS_MQTT_USERNAME',
  GLADYS_MQTT_USERNAME_VALUE: 'gladys',
  GLADYS_MQTT_PASSWORD_KEY: 'GLADYS_MQTT_PASSWORD',
  DOCKER_MQTT_VERSION: 'DOCKER_MQTT_VERSION', // Variable to identify last version of MQTT docker file is installed
  DOCKER_Z2M_VERSION: 'DOCKER_Z2M_VERSION', // Variable to identify last version of Z2M docker file is installed
};

const DEFAULT = {
  TOPICS: [
    'zigbee2mqtt/#', // Default zigbee2mqtt topic
  ],
  DOCKER_MQTT_VERSION: '3', // Last version of MQTT docker file
  DOCKER_Z2M_VERSION: '3', // Last version of Z2M docker file
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
};
