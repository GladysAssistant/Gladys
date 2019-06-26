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

const SYSTEM_VARIABLE_NAMES = {
  DEVICE_STATE_HISTORY_IN_DAYS: 'DEVICE_STATE_HISTORY_IN_DAYS',
};

const EVENTS = {
  DEVICE: {
    NEW: 'device.new',
    ADD_FEATURE: 'device.add-feature',
    ADD_PARAM: 'device.add-param',
    NEW_STATE: 'device.new-state',
    PURGE_STATES: 'device.purge-states',
  },
  GATEWAY: {
    CREATE_BACKUP: 'gateway.create-backup',
    RESTORE_BACKUP: 'gateway.restore-backup',
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
  LIGHT: {
    TURN_ON: 'light.turn-on',
  },
  TIME: {
    DELAY: 'delay',
  },
  SERVICE: {
    START: 'service.start',
    STOP: 'service.stop',
  },
  SCENE: {
    START: 'scene.start',
  },
  TELEGRAM: {
    SEND: 'telegram.send',
  },
};

const INTENTS = {
  LIGHT: {
    TURN_ON: 'intent.light.turn-on',
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
  CAMERA: 'camera',
  UNKNOWN: 'unknown',
};

const DEVICE_FEATURE_TYPES = {
  LIGHT: {
    BINARY: 'binary',
    BRIGHTNESS: 'brightness',
    HUE: 'hue',
    SATURATION: 'saturation',
  },
  SENSOR: {
    DECIMAL: 'decimal',
    INTEGER: 'integer',
    BINARY: 'binary',
    PUSH: 'push',
    UNKNOWN: 'unknown',
  },
  CAMERA: {
    IMAGE: 'image',
  },
};

const DEVICE_FEATURE_UNITS = {
  CELSIUS: 'celsius',
  FAHRENHEIT: 'fahrenheit',
  PERCENT: 'percent',
};

const ACTIONS_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
};

const DEVICE_POLL_FREQUENCIES = {
  EVERY_MINUTES: 60 * 1000,
};

const WEBSOCKET_MESSAGE_TYPES = {
  BACKUP: {
    DOWNLOADED: 'backup.downloaded',
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
    NODE_READY: 'zwave.node-ready',
    SCAN_COMPLETE: 'zwave.scan-complete',
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

module.exports.SYSTEM_VARIABLE_NAMES = SYSTEM_VARIABLE_NAMES;

module.exports.DASHBOARD_TYPE = DASHBOARD_TYPE;
module.exports.DASHBOARD_TYPE_LIST = DASHBOARD_TYPE_LIST;
module.exports.DASHBOARD_BOX_TYPE = DASHBOARD_BOX_TYPE;
module.exports.DASHBOARD_BOX_TYPE_LIST = DASHBOARD_BOX_TYPE_LIST;

module.exports.ERROR_MESSAGES = ERROR_MESSAGES;
