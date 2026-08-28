const CONFIGURATION = {
  Z2M_DRIVER_PATH: 'ZIGBEE2MQTT_DRIVER_PATH',
  Z2M_BACKUP: 'Z2M_BACKUP',
  ZIGBEE_DONGLE_NAME: 'ZIGBEE_DONGLE_NAME',
  Z2M_MQTT_MODE: 'Z2M_MQTT_MODE',
  Z2M_TCP_PORT: 'Z2M_TCP_PORT',
  Z2M_ADAPTER_MODE: 'Z2M_ADAPTER_MODE',
  Z2M_NETWORK_ADAPTER_URL: 'Z2M_NETWORK_ADAPTER_URL',
  Z2M_NETWORK_ADAPTER_TYPE: 'Z2M_NETWORK_ADAPTER_TYPE',
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
  Z2M_FRONTEND_URL: 'Z2M_FRONTEND_URL',
};

const MQTT_MODE = {
  LOCAL: 'local',
  EXTERNAL: 'external',
};

// Params stored on each Gladys device created by this service
const DEVICE_PARAMS = {
  // The Zigbee IEEE address is the immutable hardware identifier of the device,
  // used to keep the link with Gladys when the device is renamed in Zigbee2mqtt.
  IEEE_ADDRESS: 'IEEE_ADDRESS',
};

// Zigbee coordinator connection: plugged in USB, or reachable over the network (tcp://<host>:<port>)
const ADAPTER_MODE = {
  USB: 'usb',
  NETWORK: 'network',
};

const SETUP_VARIABLES = [
  CONFIGURATION.Z2M_DRIVER_PATH,
  CONFIGURATION.ZIGBEE_DONGLE_NAME,
  CONFIGURATION.Z2M_TCP_PORT,
  CONFIGURATION.Z2M_ADAPTER_MODE,
  CONFIGURATION.Z2M_NETWORK_ADAPTER_URL,
  CONFIGURATION.Z2M_NETWORK_ADAPTER_TYPE,
  CONFIGURATION.MQTT_URL_KEY,
  CONFIGURATION.GLADYS_MQTT_USERNAME_KEY,
  CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY,
  CONFIGURATION.Z2M_MQTT_MODE,
  CONFIGURATION.Z2M_FRONTEND_URL,
];

const DEFAULT = {
  TOPICS: [
    'zigbee2mqtt/#', // Default zigbee2mqtt topic
  ],
  DOCKER_MQTT_VERSION: '4', // Last version of MQTT docker file
  DOCKER_Z2M_VERSION: '11', // Last version of Z2M docker file,
  CONFIGURATION_PATH: 'zigbee2mqtt/z2m/configuration.yaml',
  CONFIGURATION_CONTENT: {
    homeassistant: false,
    permit_join: false,
    mqtt: {
      base_topic: 'zigbee2mqtt',
      server: 'mqtt://localhost:1884',
    },
    serial: {
      port: '/dev/ttyACM0',
    },
    map_options: {
      graphviz: {
        colors: {
          fill: {
            enddevice: '#fff8ce',
            coordinator: '#e04e5d',
            router: '#4ea3e0',
          },
          font: {
            coordinator: '#ffffff',
            router: '#ffffff',
            enddevice: '#000000',
          },
          line: {
            active: '#009900',
            inactive: '#994444',
          },
        },
      },
    },
  },
  CONFIGURATION_PORTS: {
    min: 12000,
    max: 12999,
    defaultPort: 8080,
  },
};

module.exports = {
  CONFIGURATION,
  MQTT_MODE,
  DEVICE_PARAMS,
  ADAPTER_MODE,
  SETUP_VARIABLES,
  DEFAULT,
};
