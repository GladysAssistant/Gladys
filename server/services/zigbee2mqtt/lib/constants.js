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

// Reasons why Gladys failed to connect to the MQTT broker, displayed as explicit messages in the UI
const MQTT_CONNECTION_ERROR = {
  BAD_CREDENTIALS: 'BAD_CREDENTIALS',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  BROKER_UNREACHABLE: 'BROKER_UNREACHABLE',
};

// Zigbee coordinator connection: plugged in USB, or reachable over the network (tcp://<host>:<port>)
const ADAPTER_MODE = {
  USB: 'usb',
  NETWORK: 'network',
};

// Installation of Zigbee2mqtt launched by the setup, followed by the setup page (see startInstallation)
const INSTALLATION_STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
};

const INSTALLATION_KIND = {
  INSTALL: 'install',
  UPDATE: 'update',
  // Another coordinator replaces the configured one
  SWITCH: 'switch',
};

// Phases of an installation, in the order they are shown
const INSTALLATION_PHASE = {
  PULL_Z2M: 'pull_z2m',
  PULL_MQTT: 'pull_mqtt',
  START_MQTT: 'start_mqtt',
  START_Z2M: 'start_z2m',
  // Until Zigbee2mqtt answers, which it does once connected to the coordinator
  CONNECT_ADAPTER: 'connect_adapter',
};

const INSTALLATION_PHASE_STATE = {
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  // Nothing to do: the image is there, the container already runs
  SKIPPED: 'skipped',
  FAILED: 'failed',
};

// Share of each phase in the progress of an installation. Downloading the Zigbee2mqtt image (48 MB compressed, 214 MB
// on disk) takes most of the time, the broker image is 8 times smaller; Zigbee2mqtt then takes a while to answer.
const INSTALLATION_PHASE_WEIGHTS = {
  [INSTALLATION_PHASE.PULL_Z2M]: 50,
  [INSTALLATION_PHASE.PULL_MQTT]: 10,
  [INSTALLATION_PHASE.START_MQTT]: 10,
  [INSTALLATION_PHASE.START_Z2M]: 10,
  [INSTALLATION_PHASE.CONNECT_ADAPTER]: 20,
};

// Failures of an installation without a code of their own (see readZ2mContainerLogs for the others)
const INSTALLATION_ERROR = {
  // Zigbee2mqtt neither answered nor told why
  NO_ANSWER: 'NO_ANSWER',
  // The configured USB dongle is not plugged in, so Zigbee2mqtt was not started
  DONGLE_NOT_FOUND: 'DONGLE_NOT_FOUND',
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
  DOCKER_Z2M_VERSION: '13', // Last version of Z2M docker file,
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
  MQTT_CONNECTION_ERROR,
  ADAPTER_MODE,
  INSTALLATION_STATE,
  INSTALLATION_KIND,
  INSTALLATION_PHASE,
  INSTALLATION_PHASE_STATE,
  INSTALLATION_PHASE_WEIGHTS,
  INSTALLATION_ERROR,
  SETUP_VARIABLES,
  DEFAULT,
};
