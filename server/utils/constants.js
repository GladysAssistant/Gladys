const STATE = {
  ON: 1,
  OFF: 0,
};

const USER_ROLE = {
  ADMIN: 'admin',
  HABITANT: 'habitant',
  GUEST: 'guest',
};

const AVAILABLE_LANGUAGES = {
  EN: 'en',
  FR: 'fr',
};

const SESSION_TOKEN_TYPES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  API_KEY: 'api_key',
};

const SERVICE_STATUS = {
  UNKNOWN: 'UNKNOWN',
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
  LOADING: 'LOADING',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
};

const SYSTEM_VARIABLE_NAMES = {
  DEVICE_STATE_HISTORY_IN_DAYS: 'DEVICE_STATE_HISTORY_IN_DAYS',
  GLADYS_GATEWAY_BACKUP_KEY: 'GLADYS_GATEWAY_BACKUP_KEY',
  TIMEZONE: 'TIMEZONE',
};

const EVENTS = {
  DEVICE: {
    NEW: 'device.new',
    CREATE: 'device.create',
    UPDATE: 'device.update',
    DELETE: 'device.delete',
    ADD_FEATURE: 'device.add-feature',
    ADD_PARAM: 'device.add-param',
    NEW_STATE: 'device.new-state',
    PURGE_STATES: 'device.purge-states',
  },
  GATEWAY: {
    CREATE_BACKUP: 'gateway.create-backup',
    CHECK_IF_BACKUP_NEEDED: 'gateway.check-if-backup-needed',
    RESTORE_BACKUP: 'gateway.restore-backup',
    NEW_MESSAGE_API_CALL: 'gateway.new-message-api-call',
    NEW_MESSAGE_OWNTRACKS_LOCATION: 'gateway.new-message-owntracks-location',
  },
  USER_SLEEP: {
    TIME_TO_WAKE_UP: 'user.time-to-wake-up',
    CANCELED_WAKE_UP: 'user.canceled-wake-up',
    WOKE_UP: 'user.woke-up',
    FELL_ASLEEP: 'user.fell-asleep',
    CANCELED_SLEEP: 'user.canceled_sleep',
    TIME_TO_SLEEP: 'user.time-to-sleep',
  },
  USER_PRESENCE: {
    LEFT_HOME: 'user.left-home',
    BACK_HOME: 'user.back-home',
    SEEN_AT_HOME: 'user.seen-at-home',
  },
  USER_WORK: {
    TIME_TO_GO_TO_WORK: 'user.time-to-go-to-work',
    CANCELED_GOING_TO_WORK: 'user.canceled-going-to-work',
    ARRIVED_AT_WORK: 'user.arrived-at-work',
    TIME_TO_LEAVE_WORK: 'user.time-to-leave-work',
    CANCELED_LEAVING_WORK: 'user.canceled-leaving-work',
  },
  HOUSE_ALARM: {
    ATTEMPTED_TO_ARM: 'house.attempted-to-arm',
    ARMED: 'house.armed',
    FAILED_TO_ARM: 'house.failed-to-arm',
    ATTEMPTED_TO_DISARM: 'house.attempted-to-disarm',
    FAILED_TO_DISARM: 'house.failed-to-disarm',
    TRIGGERED: 'house.triggered',
    TRIGGERED_STOPPED: 'house.triggered-stopped',
    DISARMED: 'house.disarmed',
  },
  SUN: {
    SUNSET: 'sun.sunset',
    SUNRISE: 'sun.sunrise',
  },
  SCENE: {
    TRIGGERED: 'scene.triggered',
    SUCCEEDED: 'scene.succeeded',
    FAILED: 'scene.failed',
  },
  ACTION: {
    TRIGGERED: 'action.triggered',
  },
  LIGHT: {
    TURNED_ON: 'light.turned-on',
    TURNED_OFF: 'light.turned-off',
    BRIGHTNESS_CHANGED: 'light.brightness-changed',
    HUE_CHANGED: 'light.hue-changed',
    SATURATION_CHANGED: 'light.saturation-changed',
  },
  TIME: {
    CHANGED: 'time.changed',
  },
  TRIGGERS: {
    CHECK: 'trigger.check',
  },
  TEMPERATURE_SENSOR: {
    TEMPERATURE_CHANGED: 'temperature.changed',
  },
  SCHEDULED_SCENE: {
    ENABLED: 'scheduled-scene.enabled',
    DISABLED: 'scheduled-scene.disabled',
    TRIGGERED: 'scheduled-scene.triggered',
  },
  MESSAGE: {
    NEW: 'message.new',
  },
  SYSTEM: {
    DOWNLOAD_UPGRADE: 'system.download-upgrade',
    CHECK_UPGRADE: 'system.check-upgrade',
    TIMEZONE_CHANGED: 'system.timezone-changed',
  },
  WEBSOCKET: {
    SEND: 'websocket.send',
    SEND_ALL: 'websocket.send-all',
  },
};

const LIFE_EVENTS = {
  USER_SLEEP: EVENTS.USER_SLEEP,
  USER_PRESENCE: EVENTS.USER_PRESENCE,
  USER_WORK: EVENTS.WORK,
};

const STATES = {
  USER_SLEEP: {
    ASLEEP: 'user.asleep',
    NEED_TO_WAKE_UP: 'user.need-to-wake-up',
    AWAKE: 'user.awake',
    NEED_TO_SLEEP: 'user.need-to-sleep',
  },
  USER_PRESENCE: {
    AT_HOME: 'user.at-home',
    OUT: 'user.out',
  },
  USER_WORK: {
    NOT_AT_WORK: 'user.not-at-work',
    NEED_TO_GO_TO_WORK: 'user.need-to-go-to-work',
    AT_WORK: 'user.at-work',
    NEED_TO_LEAVE_WORK: 'user.need-to-leave-work',
  },
  HOUSE_ALARM: {
    DISARMED: 'house.alarm.disarmed',
    TRYING_TO_ARM: 'house.alarm.trying-to-arm',
    ARMED: 'house.alarm.armed',
    TRYING_TO_DISARM: 'house.alarm.trying-to-disarm',
    TRIGGERED: 'house.alarm.triggered',
  },
};

const CONDITIONS = {
  USER_SLEEP: {
    IS_ASLEEP: 'user.is-asleep',
    IS_AWAKE: 'user.is-awake',
    NEED_TO_WAKE_UP: 'user.need-to-wake-up',
    NEEED_TO_SLEEP: 'user.need-to-sleep',
  },
  USER_PRESENCE: {
    IS_AT_HOME: 'user.is-at-home',
    IS_OUT: 'user.is-out',
  },
  USER_WORK: {
    IS_NOT_AT_WORK: 'user.is-not-at-work',
    NEED_TO_GO_TO_WORK: 'user.need-to-go-to-work',
    IS_AT_WORK: 'user.is-at-work',
    NEED_TO_LEAVE_WORK: 'user.need-to-leave-work',
  },
  HOUSE_ALARM: {
    IS_DISARMED: 'house.alarm.is-disarmed',
    IS_TRYING_TO_ARM: 'house.alarm.is-trying-to-arm',
    IS_ARMED: 'house.alarm.is-armed',
    IS_TRYING_TO_DISARM: 'house.alarm.is-trying-to-disarm',
    IS_TRIGGERED: 'house.alarm.is-triggered',
  },
};

const ACTIONS = {
  DEVICE: {
    SET_VALUE: 'device.set-value',
    GET_VALUE: 'device.get-value',
  },
  LIGHT: {
    TURN_ON: 'light.turn-on',
    TURN_OFF: 'light.turn-off',
  },
  SWITCH: {
    TURN_ON: 'switch.turn-on',
    TURN_OFF: 'switch.turn-off',
  },
  TIME: {
    DELAY: 'delay',
  },
  SCENE: {
    START: 'scene.start',
  },
  MESSAGE: {
    SEND: 'message.send',
  },
  CONDITION: {
    ONLY_CONTINUE_IF: 'condition.only-continue-if',
  },
};

const INTENTS = {
  LIGHT: {
    TURN_ON: 'intent.light.turn-on',
    TURN_OFF: 'intent.light.turn-off',
  },
  TEMPERATURE_SENSOR: {
    GET_IN_ROOM: 'intent.temperature-sensor.get-in-room',
  },
  WEATHER: {
    GET: 'intent.weather.get',
  },
  CAMERA: {
    GET_IMAGE_ROOM: 'intent.camera.get-image-room',
  },
};

const DEVICE_FEATURE_CATEGORIES = {
  LIGHT: 'light',
  BATTERY: 'battery',
  TEMPERATURE_SENSOR: 'temperature-sensor',
  MOTION_SENSOR: 'motion-sensor',
  LIGHT_SENSOR: 'light-sensor',
  SMOKE_SENSOR: 'smoke-sensor',
  SISMIC_SENSOR: 'sismic-sensor',
  PRESSURE_SENSOR: 'pressure-sensor',
  OPENING_SENSOR: 'opening-sensor',
  HUMIDITY_SENSOR: 'humidity-sensor',
  VIBRATION_SENSOR: 'vibration-sensor',
  CO2_SENSOR: 'co2-sensor',
  COUNTER_SENSOR: 'counter-sensor',
  LEAK_SENSOR: 'leak-sensor',
  CAMERA: 'camera',
  SWITCH: 'switch',
  SIREN: 'siren',
  ACCESS_CONTROl: 'access-control',
  CUBE: 'cube',
  BUTTON: 'button',
  UNKNOWN: 'unknown',
};

const DEVICE_FEATURE_TYPES = {
  LIGHT: {
    BINARY: 'binary',
    BRIGHTNESS: 'brightness',
    HUE: 'hue',
    SATURATION: 'saturation',
    COLOR: 'color',
    TEMPERATURE: 'temperature',
    POWER: 'power',
    EFFECT_MODE: 'effect-mode',
    EFFECT_SPEED: 'effect-speed',
  },
  SENSOR: {
    DECIMAL: 'decimal',
    INTEGER: 'integer',
    BINARY: 'binary',
    PUSH: 'push',
    UNKNOWN: 'unknown',
  },
  SWITCH: {
    BINARY: 'binary',
    POWER: 'power',
    POWERHOUR: 'power-hour',
    ENERGY: 'energy',
    VOLTAGE: 'voltage',
    CURRENT: 'current',
    BURGLAR: 'burglar',
    DIMMER: 'dimmer',
  },
  CAMERA: {
    IMAGE: 'image',
  },
  SIREN: {
    BINARY: 'binary',
  },
  ACCESS_CONTROL: {
    MODE: 'mode',
  },
  CUBE: {
    MODE: 'mode',
    ROTATION: 'rotation',
  },
  BATTERY: {
    INTEGER: 'integer',
  },
  VIBRATION_SENSOR: {
    STATUS: 'status',
    TILT_ANGLE: 'tilt-angle',
    ACCELERATION_X: 'acceleration-x',
    ACCELERATION_Y: 'acceleration-y',
    ACCELERATION_Z: 'acceleration-z',
    BED_ACTIVITY: 'bed-activity',
  },
  BUTTON: {
    CLICK: 'click',
  },
  UNKNOWN: {
    UNKNOWN: 'unknown',
  },
};

const DEVICE_FEATURE_UNITS = {
  CELSIUS: 'celsius',
  FAHRENHEIT: 'fahrenheit',
  PERCENT: 'percent',
  PASCAL: 'pascal',
  LUX: 'lux',
  WATT: 'watt',
  KILOWATT: 'kilowatt',
  KILOWATT_HOUR: 'kilowatt-hour',
  AMPERE: 'ampere',
  VOLT: 'volt',
  PPM: 'ppm',
};

const ACTIONS_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
};

const DEVICE_POLL_FREQUENCIES = {
  EVERY_MINUTES: 60 * 1000,
  EVERY_30_SECONDS: 30 * 1000,
  EVERY_10_SECONDS: 10 * 1000,
  EVERY_2_SECONDS: 2 * 1000,
  EVERY_SECONDS: 1 * 1000,
};

const WEBSOCKET_MESSAGE_TYPES = {
  BACKUP: {
    DOWNLOADED: 'backup.downloaded',
  },
  DEVICE: {
    NEW_STATE: 'device.new-state',
    NEW_STRING_STATE: 'device.new-string-state',
  },
  MESSAGE: {
    NEW: 'message.new',
  },
  AUTHENTICATION: {
    REQUEST: 'authenticate.request',
  },
  GATEWAY: {
    BACKUP_UPLOAD_PROGRESS: 'gateway.backup-upload-progress',
    BACKUP_DOWNLOAD_PROGRESS: 'gateway.backup-download-progress',
  },
  SCENE: {
    EXECUTING_ACTION: 'scene.executing-action',
    FINISHED_EXECUTING_ACTION: 'scene.finished-executing-action',
  },
  USER_PRESENCE: {
    LEFT_HOME: 'user.left-home',
    BACK_HOME: 'user.back-home',
    SEEN_AT_HOME: 'user.seen-at-home',
  },
  UPGRADE: {
    DOWNLOAD_PROGRESS: 'upgrade.download-progress',
    DOWNLOAD_FINISHED: 'upgrade.download-finished',
    DOWNLOAD_FAILED: 'upgrade.download-failed',
  },
  ZWAVE: {
    DRIVER_READY: 'zwave.driver-ready',
    DRIVER_FAILED: 'zwave.driver-failed',
    NODE_READY: 'zwave.node-ready',
    SCAN_COMPLETE: 'zwave.scan-complete',
    NODE_ADDED: 'zwave.node-added',
    NODE_REMOVED: 'zwave.node-removed',
  },
  MQTT: {
    CONNECTED: 'mqtt.connected',
    ERROR: 'mqtt.error',
    INSTALLATION_STATUS: 'mqtt.install-status',
  },
  ZIGBEE2MQTT: {
    DISCOVER: 'zigbee2mqtt.discover',
    MQTT_CONNECTED: 'zigbee2mqtt.mqtt-connected',
    MQTT_ERROR: 'zigbee2mqtt.mqtt-error',
  },
  XIAOMI: {
    NEW_DEVICE: 'xiaomi.new-device',
  },
  TASMOTA: {
    NEW_MQTT_DEVICE: 'tasmota.new-mqtt-device',
    NEW_HTTP_DEVICE: 'tasmota.new-http-device',
  },
  BLUETOOTH: {
    STATE: 'bluetooth.status',
    DISCOVER: 'bluetooth.discover',
  },
};

const DASHBOARD_TYPE = {
  MAIN: 'main',
};

const DASHBOARD_BOX_TYPE = {
  WEATHER: 'weather',
  TEMPERATURE_IN_ROOM: 'temperature-in-room',
  USER_PRESENCE: 'user-presence',
  CAMERA: 'camera',
  DEVICES_IN_ROOM: 'devices-in-room',
};

const ERROR_MESSAGES = {
  HOUSE_HAS_NO_COORDINATES: 'HOUSE_HAS_NO_COORDINATES',
  SERVICE_NOT_CONFIGURED: 'SERVICE_NOT_CONFIGURED',
  REQUEST_TO_THIRD_PARTY_FAILED: 'REQUEST_TO_THIRD_PARTY_FAILED',
  INVALID_ACCESS_TOKEN: 'INVALID_ACCESS_TOKEN',
  NO_CONNECTED_TO_THE_INTERNET: 'NO_CONNECTED_TO_THE_INTERNET',
};

const createList = (obj) => {
  const list = [];
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object') {
      Object.keys(obj[key]).forEach((secondKey) => {
        list.push(obj[key][secondKey]);
      });
    } else {
      list.push(obj[key]);
    }
  });
  return list;
};

// build lists from object
const EVENT_LIST = createList(EVENTS);
const LIFE_EVENT_LIST = createList(LIFE_EVENTS);
const ACTION_LIST = createList(ACTIONS);
const CONDITION_LIST = createList(CONDITIONS);
const DEVICE_FEATURE_CATEGORIES_LIST = createList(DEVICE_FEATURE_CATEGORIES);
const DEVICE_FEATURE_TYPES_LIST = createList(DEVICE_FEATURE_TYPES);
const USER_ROLE_LIST = createList(USER_ROLE);
const AVAILABLE_LANGUAGES_LIST = createList(AVAILABLE_LANGUAGES);
const SESSION_TOKEN_TYPE_LIST = createList(SESSION_TOKEN_TYPES);
const DEVICE_FEATURE_UNITS_LIST = createList(DEVICE_FEATURE_UNITS);
const DASHBOARD_TYPE_LIST = createList(DASHBOARD_TYPE);
const DASHBOARD_BOX_TYPE_LIST = createList(DASHBOARD_BOX_TYPE);

module.exports.STATE = STATE;
module.exports.EVENTS = EVENTS;
module.exports.LIFE_EVENTS = LIFE_EVENTS;
module.exports.STATES = STATES;
module.exports.CONDITIONS = CONDITIONS;
module.exports.ACTIONS = ACTIONS;
module.exports.INTENTS = INTENTS;
module.exports.DEVICE_FEATURE_CATEGORIES = DEVICE_FEATURE_CATEGORIES;
module.exports.DEVICE_FEATURE_TYPES = DEVICE_FEATURE_TYPES;
module.exports.ACTIONS_STATUS = ACTIONS_STATUS;
module.exports.USER_ROLE = USER_ROLE;
module.exports.AVAILABLE_LANGUAGES = AVAILABLE_LANGUAGES;
module.exports.SESSION_TOKEN_TYPES = SESSION_TOKEN_TYPES;

module.exports.EVENT_LIST = EVENT_LIST;
module.exports.LIFE_EVENT_LIST = LIFE_EVENT_LIST;
module.exports.ACTION_LIST = ACTION_LIST;
module.exports.CONDITION_LIST = CONDITION_LIST;
module.exports.DEVICE_FEATURE_CATEGORIES_LIST = DEVICE_FEATURE_CATEGORIES_LIST;
module.exports.DEVICE_FEATURE_TYPES_LIST = DEVICE_FEATURE_TYPES_LIST;
module.exports.USER_ROLE_LIST = USER_ROLE_LIST;
module.exports.AVAILABLE_LANGUAGES_LIST = AVAILABLE_LANGUAGES_LIST;
module.exports.SESSION_TOKEN_TYPE_LIST = SESSION_TOKEN_TYPE_LIST;

module.exports.DEVICE_POLL_FREQUENCIES = DEVICE_POLL_FREQUENCIES;
module.exports.DEVICE_POLL_FREQUENCIES_LIST = createList(DEVICE_POLL_FREQUENCIES);

module.exports.WEBSOCKET_MESSAGE_TYPES = WEBSOCKET_MESSAGE_TYPES;

module.exports.DEVICE_FEATURE_UNITS = DEVICE_FEATURE_UNITS;
module.exports.DEVICE_FEATURE_UNITS_LIST = DEVICE_FEATURE_UNITS_LIST;

module.exports.SERVICE_STATUS = SERVICE_STATUS;
module.exports.SERVICE_STATUS_LIST = createList(SERVICE_STATUS);

module.exports.SYSTEM_VARIABLE_NAMES = SYSTEM_VARIABLE_NAMES;

module.exports.DASHBOARD_TYPE = DASHBOARD_TYPE;
module.exports.DASHBOARD_TYPE_LIST = DASHBOARD_TYPE_LIST;
module.exports.DASHBOARD_BOX_TYPE = DASHBOARD_BOX_TYPE;
module.exports.DASHBOARD_BOX_TYPE_LIST = DASHBOARD_BOX_TYPE_LIST;

module.exports.ERROR_MESSAGES = ERROR_MESSAGES;
