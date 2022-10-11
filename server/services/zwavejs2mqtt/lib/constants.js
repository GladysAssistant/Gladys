const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  BUTTON_STATUS,
  DEVICE_FEATURE_MINMAX_BY_TYPE,
  STATE,
} = require('../../../utils/constants');

const COMMAND_CLASSES = {
  COMMAND_CLASS_ANTITHEFT: 93,
  COMMAND_CLASS_APPLICATION_CAPABILITY: 87,
  COMMAND_CLASS_APPLICATION_STATUS: 34,
  COMMAND_CLASS_ASSOCIATION: 133,
  COMMAND_CLASS_ASSOCIATION_COMMAND_CONFIGURATION: 155,
  COMMAND_CLASS_ASSOCIATION_GRP_INFO: 89,
  COMMAND_CLASS_BARRIER_OPERATOR: 102,
  COMMAND_CLASS_BASIC: 32,
  COMMAND_CLASS_BASIC_TARIFF_INFO: 54,
  COMMAND_CLASS_BASIC_WINDOW_COVERING: 80,
  COMMAND_CLASS_BATTERY: 128,
  COMMAND_CLASS_CENTRAL_SCENE: 91,
  COMMAND_CLASS_CLIMATE_CONTROL_SCHEDULE: 70,
  COMMAND_CLASS_CLOCK: 129,
  COMMAND_CLASS_CONFIGURATION: 112,
  COMMAND_CLASS_CONTROLLER_REPLICATION: 33,
  COMMAND_CLASS_CRC_16_ENCAP: 86,
  COMMAND_CLASS_DCP_CONFIG: 58,
  COMMAND_CLASS_DCP_MONITOR: 59,
  COMMAND_CLASS_DEVICE_RESET_LOCALLY: 90,
  COMMAND_CLASS_DOOR_LOCK: 98,
  COMMAND_CLASS_DOOR_LOCK_LOGGING: 76,
  COMMAND_CLASS_ENERGY_PRODUCTION: 144,
  COMMAND_CLASS_ENTRY_CONTROL: 111,
  COMMAND_CLASS_FIRMWARE_UPDATE_MD: 122,
  COMMAND_CLASS_GEOGRAPHIC_LOCATION: 140,
  COMMAND_CLASS_GROUPING_NAME: 123,
  COMMAND_CLASS_HAIL: 130,
  COMMAND_CLASS_HRV_CONTROL: 57,
  COMMAND_CLASS_HRV_STATUS: 55,
  COMMAND_CLASS_HUMIDITY_CONTROL_MODE: 109,
  COMMAND_CLASS_HUMIDITY_CONTROL_OPERATING_STATE: 110,
  COMMAND_CLASS_HUMIDITY_CONTROL_SETPOINT: 100,
  COMMAND_CLASS_INDICATOR: 135,
  COMMAND_CLASS_IP_ASSOCIATION: 92,
  COMMAND_CLASS_IP_CONFIGURATION: 14,
  COMMAND_CLASS_IRRIGATION: 107,
  COMMAND_CLASS_LANGUAGE: 137,
  COMMAND_CLASS_LOCK: 118,
  COMMAND_CLASS_MAILBOX: 105,
  COMMAND_CLASS_MANUFACTURER_PROPRIETARY: 145,
  COMMAND_CLASS_MANUFACTURER_SPECIFIC: 114,
  COMMAND_CLASS_MARK: 239,
  COMMAND_CLASS_METER: 50,
  COMMAND_CLASS_METER_PULSE: 53,
  COMMAND_CLASS_METER_TBL_CONFIG: 60,
  COMMAND_CLASS_METER_TBL_MONITOR: 61,
  COMMAND_CLASS_METER_TBL_PUSH: 62,
  COMMAND_CLASS_MTP_WINDOW_COVERING: 81,
  COMMAND_CLASS_MULTI_CHANNEL: 96,
  COMMAND_CLASS_MULTI_CHANNEL_ASSOCIATION: 142,
  COMMAND_CLASS_MULTI_COMMAND: 143,
  COMMAND_CLASS_NETWORK_MANAGEMENT_BASIC: 77,
  COMMAND_CLASS_NETWORK_MANAGEMENT_INCLUSION: 52,
  COMMAND_CLASS_NETWORK_MANAGEMENT_PRIMARY: 84,
  COMMAND_CLASS_NETWORK_MANAGEMENT_PROXY: 82,
  COMMAND_CLASS_NO_OPERATION: 0,
  COMMAND_CLASS_NODE_NAMING: 119,
  COMMAND_CLASS_NON_INTEROPERABLE: 240,
  COMMAND_CLASS_NOTIFICATION: 113,
  COMMAND_CLASS_POWERLEVEL: 115,
  COMMAND_CLASS_PREPAYMENT: 63,
  COMMAND_CLASS_PREPAYMENT_ENCAPSULATION: 65,
  COMMAND_CLASS_PROPRIETARY: 136,
  COMMAND_CLASS_PROTECTION: 117,
  COMMAND_CLASS_RATE_TBL_CONFIG: 72,
  COMMAND_CLASS_RATE_TBL_MONITOR: 73,
  COMMAND_CLASS_REMOTE_ASSOCIATION_ACTIVATE: 124,
  COMMAND_CLASS_REMOTE_ASSOCIATION: 125,
  COMMAND_CLASS_SCENE_ACTIVATION: 43,
  COMMAND_CLASS_SCENE_ACTUATOR_CONF: 44,
  COMMAND_CLASS_SCENE_CONTROLLER_CONF: 45,
  COMMAND_CLASS_SCHEDULE: 83,
  COMMAND_CLASS_SCHEDULE_ENTRY_LOCK: 78,
  COMMAND_CLASS_SCREEN_ATTRIBUTES: 147,
  COMMAND_CLASS_SCREEN_MD: 146,
  COMMAND_CLASS_SECURITY: 152,
  COMMAND_CLASS_SECURITY_SCHEME0_MARK: 61696,
  COMMAND_CLASS_SENSOR_ALARM: 156,
  COMMAND_CLASS_SENSOR_BINARY: 48,
  COMMAND_CLASS_SENSOR_CONFIGURATION: 158,
  COMMAND_CLASS_SENSOR_MULTILEVEL: 49,
  COMMAND_CLASS_SILENCE_ALARM: 157,
  COMMAND_CLASS_SIMPLE_AV_CONTROL: 148,
  COMMAND_CLASS_SUPERVISION: 108,
  COMMAND_CLASS_SWITCH_ALL: 39,
  COMMAND_CLASS_SWITCH_BINARY: 37,
  COMMAND_CLASS_SWITCH_COLOR: 51,
  COMMAND_CLASS_SWITCH_MULTILEVEL: 38,
  COMMAND_CLASS_SWITCH_TOGGLE_BINARY: 40,
  COMMAND_CLASS_SWITCH_TOGGLE_MULTILEVEL: 41,
  COMMAND_CLASS_TARIFF_TBL_CONFIG: 74,
  COMMAND_CLASS_TARIFF_TBL_MONITOR: 75,
  COMMAND_CLASS_THERMOSTAT_FAN_MODE: 68,
  COMMAND_CLASS_THERMOSTAT_FAN_STATE: 69,
  COMMAND_CLASS_THERMOSTAT_MODE: 64,
  COMMAND_CLASS_THERMOSTAT_OPERATING_STATE: 66,
  COMMAND_CLASS_THERMOSTAT_SETBACK: 71,
  COMMAND_CLASS_THERMOSTAT_SETPOINT: 67,
  COMMAND_CLASS_TIME: 138,
  COMMAND_CLASS_TIME_PARAMETERS: 139,
  COMMAND_CLASS_TRANSPORT_SERVICE: 85,
  COMMAND_CLASS_USER_CODE: 99,
  COMMAND_CLASS_VERSION: 134,
  COMMAND_CLASS_WAKE_UP: 132,
  COMMAND_CLASS_ZIP: 35,
  COMMAND_CLASS_ZIP_NAMING: 104,
  COMMAND_CLASS_ZIP_ND: 88,
  COMMAND_CLASS_ZIP_6LOWPAN: 79,
  COMMAND_CLASS_ZIP_GATEWAY: 95,
  COMMAND_CLASS_ZIP_PORTAL: 97,
  COMMAND_CLASS_ZWAVEPLUS_INFO: 94,
  COMMAND_CLASS_WINDOW_COVERING: 106,
};

const PROPERTIES = {
  CURRENT_VALUE: 'currentValue',
  TARGET_VALUE: 'targetValue',
  ELECTRIC_VOLTAGE: 'value-66561',
  ELECTRIC_CURRENT: 'value-66817',
  ELECTRIC_W: 'value-66048',
  ELECTRIC_CONSUMED_W: 'value-66049',
  ELECTRIC_KWH: 'value-65536',
  ELECTRIC_CONSUMED_KWH: 'value-65537',
  AIR_TEMPERATURE: 'Air temperature',
  HUMIDITY: 'Humidity',
  ILLUMINANCE: 'Illuminance',
  ULTRAVIOLET: 'Ultraviolet',
  MOTION: 'Motion',
  MOTION_ALARM: 'Home Security-Motion sensor status',
  SMOKE_ALARM: 'Smoke Alarm-Sensor status',
  SLOW_REFRESH: 'slowRefresh',
  SCENE_001: 'scene-001',
  SCENE_002: 'scene-002',
  SCENE_003: 'scene-003',
  SCENE_004: 'scene-004',
  SCENE_005: 'scene-005',
  SCENE_006: 'scene-006',
  BATTERY_LEVEL: 'level',
  CURRENT_COLOR: 'currentColor',
  TARGET_COLOR: 'targetColor',
};

const CATEGORIES = [
  // switch binary
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY],
    PROPERTIES: [PROPERTIES.TARGET_VALUE],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    MIN: 0,
    MAX: 1,
  },
  // scene switch
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.BUTTON,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE],
    PROPERTIES: [
      PROPERTIES.SCENE_001,
      PROPERTIES.SCENE_002,
      PROPERTIES.SCENE_003,
      PROPERTIES.SCENE_004,
      PROPERTIES.SCENE_005,
      PROPERTIES.SCENE_006,
    ],
    TYPE: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    MIN: 1,
    MAX: BUTTON_STATUS.LONG_CLICK,
  },
  // dimmer binary
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL],
    PROPERTIES: [PROPERTIES.TARGET_VALUE],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
  },
  // color switch
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.LIGHT,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR],
    PROPERTIES: [PROPERTIES.TARGET_VALUE],
    TYPE: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
  },
  // switch energy meter
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    PROPERTIES: [PROPERTIES.ELECTRIC_W, PROPERTIES.ELECTRIC_CONSUMED_W],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
    MIN: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.ENERGY].MIN,
    MAX: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.ENERGY].MAX,
  },
  // switch power meter
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    PROPERTIES: [PROPERTIES.ELECTRIC_KWH, PROPERTIES.ELECTRIC_CONSUMED_KWH],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.POWER,
    MIN: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.POWER].MIN,
    MAX: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.POWER].MAX,
  },
  // switch voltage
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
    PROPERTIES: [PROPERTIES.ELECTRIC_VOLTAGE],
    MIN: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE].MIN,
    MAX: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE].MAX,
  },
  // switch current
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
    PROPERTIES: [PROPERTIES.ELECTRIC_CURRENT],
    MIN: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.CURRENT].MIN,
    MAX: DEVICE_FEATURE_MINMAX_BY_TYPE[DEVICE_FEATURE_TYPES.SWITCH.CURRENT].MAX,
  },
  // dimmer power meter
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    PROPERTIES: [PROPERTIES.TARGET_VALUE],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.POWER,
    MIN: 0,
    MAX: Number.MAX_VALUE,
  },
  // temperature sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    PROPERTIES: [PROPERTIES.AIR_TEMPERATURE],
    MIN: -20,
    MAX: 50,
  },
  // humidity sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    PROPERTIES: [PROPERTIES.HUMIDITY],
    MIN: 0,
    MAX: 100,
  },
  // ultraviolet sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.UV_SENSOR,
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    PROPERTIES: [PROPERTIES.ULTRAVIOLET],
    MIN: 0,
    MAX: 100,
  },
  // battery
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.BATTERY,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_BATTERY],
    TYPE: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
    PROPERTIES: [PROPERTIES.BATTERY_LEVEL],
    MIN: 0,
    MAX: 100,
  },
  // light sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    PROPERTIES: [PROPERTIES.ILLUMINANCE],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    MIN: 0,
    MAX: 100,
  },
  // motion sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY],
    PROPERTIES: [PROPERTIES.MOTION],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  },
  // smoke sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_ALARM],
    PROPERTIES: [PROPERTIES.SMOKE_ALARM],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  },
];

const GENRE = {
  112: 'config', // COMMAND_CLASS_CONFIGURATION
  114: 'system', // COMMAND_CLASS_MANUFACTURER_SPECIFIC
  115: 'system', // COMMAND_CLASS_POWERLEVEL
  132: 'system', // COMMAND_CLASS_WAKE_UP
  134: 'system', // COMMAND_CLASS_VERSION
  94: 'system', // COMMAND_CLASS_ZWAVEPLUS_INFO
  44: 'config', // COMMAND_CLASS_SCENE_ACTUATOR_CONF
  32: 'notsupported', // COMMAND_CLASS_BASIC
  51: 'notsupported', // COMMAND_CLASS_SWITCH_COLOR
  135: 'notsupported', // COMMAND_CLASS_INDICATOR
};

const SCENE_VALUES = {
  0: BUTTON_STATUS.CLICK,
  3: BUTTON_STATUS.DOUBLE_CLICK,
  2: BUTTON_STATUS.LONG_CLICK_PRESS,
  1: BUTTON_STATUS.LONG_CLICK_RELEASE,
};

const NOTIFICATION_VALUES = {
  0: STATE.OFF,
  8: STATE.ON,
};

const SMOKE_ALARM_VALUES = {
  0: STATE.OFF,
  2: STATE.ON,
};

const NODE_STATES = {
  ALIVE: 'alive',
  DEAD: 'dead',
  SLEEP: 'sleep',
  WAKE_UP: 'wakeUp',
  INTERVIEW_STARTED: 'interviewStarted',
  INTERVIEW_STAGE_COMPLETED: 'interviewStageCompleted',
  INTERVIEW_COMPLETED: 'interviewCompleted',
  INTERVIEW_FAILED: 'interviewFailed',
};

const CONFIGURATION = {
  EXTERNAL_ZWAVEJS2MQTT: 'EXTERNAL_ZWAVEJS2MQTT',
  ZWAVEJS2MQTT_MQTT_URL: 'ZWAVEJS2MQTT_MQTT_URL',
  ZWAVEJS2MQTT_MQTT_USERNAME: 'ZWAVEJS2MQTT_MQTT_USERNAME',
  ZWAVEJS2MQTT_MQTT_PASSWORD: 'ZWAVEJS2MQTT_MQTT_PASSWORD',
  DRIVER_PATH: 'DRIVER_PATH',
  S2_UNAUTHENTICATED: 'S2_UNAUTHENTICATED',
  S2_AUTHENTICATED: 'S2_AUTHENTICATED',
  S2_ACCESS_CONTROL: 'S2_ACCESS_CONTROL',
  S0_LEGACY: 'S0_LEGACY',
};

const DEFAULT = {
  EXTERNAL_ZWAVEJS2MQTT: false,
  ROOT: 'zwavejs2mqtt',
  ZWAVEJS2MQTT_MQTT_URL_VALUE: 'mqtt://localhost:1885',
  ZWAVEJS2MQTT_MQTT_USERNAME_VALUE: 'gladys',
  MQTT_CLIENT_ID: 'gladys-main-instance',
  ZWAVEJS2MQTT_CLIENT_ID: 'ZWAVE_GATEWAY-Gladys',
  TOPICS: ['zwavejs2mqtt/#'],
};

module.exports = {
  COMMAND_CLASSES,
  PROPERTIES,
  CATEGORIES,
  GENRE,
  UNKNOWN_CATEGORY: DEVICE_FEATURE_CATEGORIES.UNKNOWN,
  UNKNOWN_TYPE: DEVICE_FEATURE_TYPES.SENSOR.UNKNOWN,
  SCENE_VALUES,
  NOTIFICATION_VALUES,
  SMOKE_ALARM_VALUES,
  NODE_STATES,
  CONFIGURATION,
  DEFAULT,
};
