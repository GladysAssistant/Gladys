const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const COMMAND_CLASSES = {
  COMMAND_CLASS_ALARM: 113,
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

const INDEXES = {
  INDEX_ALARM_TYPE: 0,
  INDEX_ALARM_LEVEL: 1,
  INDEX_ALARM_ACCESS_CONTROL: 9,
  INDEX_BARRIER_OPERATOR_LABEL: 1,
  INDEX_DOOR_LOCK_LOCK: 0,
  INDEX_METER_POWER: 8,
  INDEX_METER_RESET: 33,
  INDEX_METER_VOLTAGE: 16,
  INDEX_METER_CURRENT: 20,
  INDEX_SENSOR_MULTILEVEL_TEMPERATURE: 1,
  INDEX_SENSOR_MULTILEVEL_LIGHT: 3,
  INDEX_SENSOR_MULTILEVEL_POWER: 4,
  INDEX_SWITCH_COLOR_COLOR: 0,
  INDEX_SWITCH_COLOR_CHANNELS: 2,
  INDEX_SWITCH_MULTILEVEL_LEVEL: 0,
  INDEX_SWITCH_MULTILEVEL_BINARY: 3,
  INDEX_SWITCH_MULTILEVEL_BRIGHT: 1,
  INDEX_SWITCH_MULTILEVEL_DIM: 2,
  INDEX_SWITCH_MULTILEVEL_DURATION: 5,
  INDEX_SWITCH_MULTILEVEL_TARGET: 9,
  INDEX_NOTIFICATION_BURGLAR: 10,
  INDEX_SENSOR_BINARY_MOTION: 0,
  INDEX_SENSOR_SISMIC_INTENSITY: 25,
};

const CATEGORIES = [
  // smoke sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY],
    PRODUCT_IDS: ['0x1003'],
    PRODUCT_TYPES: ['0x0c02'],
  },
  // dimmer level
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL],
    INDEXES: [INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
    PRODUCT_IDS: ['0x1000'],
    PRODUCT_TYPES: ['0x0102', '0x1c01'],
  },
  // siren
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SIREN,
    TYPE: DEVICE_FEATURE_TYPES.SIREN.BINARY,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY],
    PRODUCT_IDS: ['0x0508'],
  },
  // access control
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.ACCESS_CONTROl,
    TYPE: DEVICE_FEATURE_TYPES.ACCESS_CONTROL.MODE,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION],
    INDEXES: [INDEXES.INDEX_ALARM_ACCESS_CONTROL],
    PRODUCT_IDS: ['0x4501'],
  },
  // temperature sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    INDEXES: [INDEXES.INDEX_SENSOR_MULTILEVEL_TEMPERATURE],
  },
  // battery
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.BATTERY,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_BATTERY],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
  },
  // light sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    INDEXES: [INDEXES.INDEX_SENSOR_MULTILEVEL_LIGHT],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
  },
  // motion sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY],
    INDEXES: [INDEXES.INDEX_SENSOR_BINARY_MOTION],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  },
  // sismic intensity sensor
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SISMIC_SENSOR,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    INDEXES: [INDEXES.INDEX_SENSOR_SISMIC_INTENSITY],
    TYPE: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  },
  // switch on/off
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  // switch power meter
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    INDEXES: [INDEXES.INDEX_METER_POWER],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.POWER,
  },
  // switch voltage
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    INDEXES: [INDEXES.INDEX_METER_VOLTAGE],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
  },
  // switch current
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_METER],
    INDEXES: [INDEXES.INDEX_METER_CURRENT],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
  },
  // switch burglar
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION],
    INDEXES: [INDEXES.INDEX_NOTIFICATION_BURGLAR],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.BURGLAR,
  },

  // dimmer binary
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL],
    INDEXES: [INDEXES.INDEX_SWITCH_MULTILEVEL_BINARY],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  // dimmer power meter
  {
    CATEGORY: DEVICE_FEATURE_CATEGORIES.SWITCH,
    COMMAND_CLASSES: [COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL],
    INDEXES: [INDEXES.INDEX_SENSOR_MULTILEVEL_POWER],
    TYPE: DEVICE_FEATURE_TYPES.SWITCH.POWER,
  },
];

const VALUE_MODES = {
  READ_ONLY: 1,
  WRITE_ONLY: 2,
  READ_WRITE: 3,
};

module.exports = {
  COMMAND_CLASSES,
  INDEXES,
  CATEGORIES,
  UNKNOWN_CATEGORY: DEVICE_FEATURE_CATEGORIES.UNKNOWN,
  UNKNOWN_TYPE: DEVICE_FEATURE_TYPES.SENSOR.UNKNOWN,
  VALUE_MODES,
};
