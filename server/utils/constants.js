const STATE = {
  ON: 1,
  OFF: 0,
};

const BUTTON_STATUS = {
  CLICK: 1,
  DOUBLE_CLICK: 2,
  LONG_CLICK_PRESS: 3,
  LONG_CLICK_RELEASE: 4,
  HOLD_CLICK: 5,
  LONG_CLICK: 6,
  ON: 7,
  OFF: 8,
  BRIGHTNESS_MOVE_DOWN: 9,
  BRIGHTNESS_MOVE_UP: 10,
  BRIGHTNESS_STOP: 11,
  ARROW_LEFT_CLICK: 12,
  ARROW_RIGHT_CLICK: 13,
  ARROW_LEFT_HOLD: 14,
  ARROW_RIGHT_HOLD: 15,
  ARROW_LEFT_RELEASE: 16,
  ARROW_RIGHT_RELEASE: 17,
  TRIPLE: 18,
  QUADRUPLE: 19,
  RELEASE: 20,
  MANY: 21,
  SHAKE: 22,
  THROW: 23,
  WAKEUP: 24,
  FALL: 25,
  TAP: 26,
  SLIDE: 27,
  FLIP_180: 28,
  FLIP_90: 29,
  ROTATE_LEFT: 30,
  ROTATE_RIGHT: 31,
  VIBRATION: 32,
  TILT: 33,
  DROP: 34,
  EMERGENCY: 35,
  DISARM: 36,
  ARM_DAY_ZONES: 37,
  ARM_ALL_ZONES: 38,
  ON_PRESS: 39,
  ON_HOLD: 40,
  UP_PRESS: 41,
  UP_HOLD: 42,
  DOWN_PRESS: 43,
  DOWN_HOLD: 44,
  OFF_PRESS: 45,
  OFF_HOLD: 46,
  INITIAL_PRESS: 47,
  LONG_PRESS: 48,
  SHORT_RELEASE: 49,
  LONG_RELEASE: 50,
  DOUBLE_PRESS: 51,
  TOGGLE: 52,
  TOGGLE_HOLD: 53,
  BRIGHTNESS_UP_CLICK: 54,
  BRIGHTNESS_UP_HOLD: 55,
  BRIGHTNESS_UP_RELEASE: 56,
  BRIGHTNESS_DOWN_CLICK: 57,
  BRIGHTNESS_DOWN_HOLD: 58,
  BRIGHTNESS_DOWN_RELEASE: 59,
  PRESSED: 60,
  SINGLE_LEFT: 61,
  SINGLE_RIGHT: 62,
  SINGLE_BOTH: 63,
  DOUBLE_LEFT: 64,
  DOUBLE_RIGHT: 65,
  DOUBLE_BOTH: 66,
  TRIPLE_LEFT: 67,
  TRIPLE_RIGHT: 68,
  TRIPLE_BOTH: 69,
  HOLD_LEFT: 70,
  HOLD_RIGHT: 71,
  HOLD_BOTH: 72,
  SINGLE_PLUS: 73,
  SINGLE_CENTER: 74,
  SINGLE_MINUS: 75,
  DOUBLE_PLUS: 76,
  DOUBLE_CENTER: 77,
  DOUBLE_MINUS: 78,
  HOLD_PLUS: 79,
  HOLD_CENTER: 80,
  HOLD_MINUS: 81,
  RELEASE_PLUS: 82,
  RELEASE_CENTER: 83,
  RELEASE_MINUS: 84,
};

const COVER_STATE = {
  STOP: 0,
  OPEN: 1,
  CLOSE: -1,
};

const SIREN_LMH_VOLUME = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

const AC_MODE = {
  AUTO: 0,
  COOLING: 1,
  HEATING: 2,
  DRYING: 3,
  FAN: 4,
};

const PILOT_WIRE_MODE = {
  OFF: 0,
  FROST_PROTECTION: 1,
  ECO: 2,
  COMFORT_1: 3,
  COMFORT_2: 4,
  COMFORT: 5,
};

const MUSIC_PLAYBACK_STATE = {
  PLAYING: 1,
  PAUSED: 0,
};

const OPENING_SENSOR_STATE = {
  OPEN: 0,
  CLOSE: 1,
};

// Used by the Tuya ME201WZ in Zigbee2mqtt
const LIQUID_STATE = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
};

const LEVEL_MATTER_STATE = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const USER_ROLE = {
  ADMIN: 'admin',
  HABITANT: 'habitant',
  GUEST: 'guest',
};

const AVAILABLE_LANGUAGES = {
  EN: 'en',
  FR: 'fr',
  DE: 'de',
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
};

const SYSTEM_VARIABLE_NAMES = {
  DEVICE_STATE_HISTORY_IN_DAYS: 'DEVICE_STATE_HISTORY_IN_DAYS',
  DEVICE_AGGREGATE_STATE_HISTORY_IN_DAYS: 'DEVICE_AGGREGATE_STATE_HISTORY_IN_DAYS',
  DEVICE_STATE_MONTHLY_AGGREGATES_RETENTION_IN_DAYS: 'DEVICE_STATE_MONTHLY_AGGREGATES_RETENTION_IN_DAYS',
  DEVICE_STATE_DAILY_AGGREGATES_RETENTION_IN_DAYS: 'DEVICE_STATE_DAILY_AGGREGATES_RETENTION_IN_DAYS',
  DEVICE_STATE_HOURLY_AGGREGATES_RETENTION_IN_DAYS: 'DEVICE_STATE_HOURLY_AGGREGATES_RETENTION_IN_DAYS',
  DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED: 'DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED',
  GLADYS_GATEWAY_BACKUP_KEY: 'GLADYS_GATEWAY_BACKUP_KEY',
  GLADYS_GATEWAY_USERS_KEYS: 'GLADYS_GATEWAY_USERS_KEYS',
  GLADYS_GATEWAY_GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY:
    'GLADYS_GATEWAY_GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY',
  GLADYS_GATEWAY_ALEXA_USER_IS_CONNECTED_WITH_GATEWAY: 'GLADYS_GATEWAY_ALEXA_USER_IS_CONNECTED_WITH_GATEWAY',
  GLADYS_GATEWAY_OPEN_AI_ENABLED: 'GLADYS_GATEWAY_OPEN_AI_ENABLED',
  TIMEZONE: 'TIMEZONE',
  DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD: 'DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD',
  DEVICE_BATTERY_LEVEL_WARNING_ENABLED: 'DEVICE_BATTERY_LEVEL_WARNING_ENABLED',
  DUCKDB_MIGRATED: 'DUCKDB_MIGRATED',
  GLADYS_VERSION: 'GLADYS_VERSION',
};

const EVENTS = {
  ALARM: {
    ARM: 'alarm.arm',
    ARMING: 'alarm.arming',
    DISARM: 'alarm.disarm',
    PARTIAL_ARM: 'alarm.partial-arm',
    PANIC: 'alarm.panic',
    TOO_MANY_CODES_TESTS: 'alarm.too-many-codes-tests',
  },
  CALENDAR: {
    EVENT_IS_COMING: 'calendar.event-is-coming',
    CHECK_IF_EVENT_IS_COMING: 'calendar.check-if-event-is-coming',
  },
  DEVICE: {
    NEW: 'device.new',
    CREATE: 'device.create',
    UPDATE: 'device.update',
    DELETE: 'device.delete',
    ADD_FEATURE: 'device.add-feature',
    ADD_PARAM: 'device.add-param',
    NEW_STATE: 'device.new-state',
    PURGE_STATES: 'device.purge-states',
    CALCULATE_HOURLY_AGGREGATE: 'device.calculate-hourly-aggregate',
    PURGE_STATES_SINGLE_FEATURE: 'device.purge-states-single-feature',
    CHECK_BATTERIES: 'device.check-batteries',
    MIGRATE_FROM_SQLITE_TO_DUCKDB: 'device.migrate-from-sqlite-to-duckdb',
    PURGE_ALL_SQLITE_STATES: 'device.purge-all-sqlite-states',
  },
  GATEWAY: {
    CREATE_BACKUP: 'gateway.create-backup',
    CHECK_IF_BACKUP_NEEDED: 'gateway.check-if-backup-needed',
    RESTORE_BACKUP: 'gateway.restore-backup',
    NEW_MESSAGE_API_CALL: 'gateway.new-message-api-call',
    NEW_MESSAGE_OWNTRACKS_LOCATION: 'gateway.new-message-owntracks-location',
    USER_KEYS_CHANGED: 'gateway.user-keys-changed',
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
    SUNRISE: 'time.sunrise',
    SUNSET: 'time.sunset',
  },
  TRIGGERS: {
    CHECK: 'trigger.check',
  },
  TEMPERATURE_SENSOR: {
    TEMPERATURE_CHANGED: 'temperature.changed',
  },
  HUMIDITY_SENSOR: {
    HUMIDITY_CHANGED: 'humidity.changed',
  },
  SCHEDULED_SCENE: {
    ENABLED: 'scheduled-scene.enabled',
    DISABLED: 'scheduled-scene.disabled',
    TRIGGERED: 'scheduled-scene.triggered',
  },
  MESSAGE: {
    NEW: 'message.new',
    NEW_FOR_OPEN_AI: 'message.new-for-open-ai',
    PURGE_OLD_MESSAGES: 'message.purge-old-messages',
  },
  SYSTEM: {
    UPGRADE_CONTAINERS: 'system.upgrade-containers',
    CHECK_UPGRADE: 'system.check-upgrade',
    TIMEZONE_CHANGED: 'system.timezone-changed',
    VACUUM: 'system.vacuum',
    START: 'system.start',
    WATCHTOWER_LOG: 'system.watchtower-log',
  },
  WEBSOCKET: {
    SEND: 'websocket.send',
    SEND_ALL: 'websocket.send-all',
  },
  HOUSE: {
    CREATED: 'house.created',
    UPDATED: 'house.updated',
    DELETED: 'house.deleted',
    EMPTY: 'house.empty',
    NO_LONGER_EMPTY: 'house.no-longer-empty',
  },
  USER: {
    NEW_LOCATION: 'user.new-location',
  },
  AREA: {
    USER_ENTERED: 'area.user-entered',
    USER_LEFT: 'area.user-left',
  },
  JOB: {
    PURGE_OLD_JOBS: 'job.purge-old-jobs',
  },
  MQTT: {
    RECEIVED: 'mqtt.received',
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
  AI: {
    ASK: 'ai.ask',
  },
  ALARM: {
    CHECK_ALARM_MODE: 'alarm.check-alarm-mode',
    SET_ALARM_MODE: 'alarm.set-alarm-mode',
  },
  CALENDAR: {
    IS_EVENT_RUNNING: 'calendar.is-event-running',
  },
  DEVICE: {
    SET_VALUE: 'device.set-value',
    GET_VALUE: 'device.get-value',
  },
  LIGHT: {
    TURN_ON: 'light.turn-on',
    TURN_OFF: 'light.turn-off',
    TOGGLE: 'light.toggle',
    BLINK: 'light.blink',
  },
  SWITCH: {
    TURN_ON: 'switch.turn-on',
    TURN_OFF: 'switch.turn-off',
    TOGGLE: 'switch.toggle',
  },
  TIME: {
    DELAY: 'delay',
  },
  SCENE: {
    START: 'scene.start',
  },
  MESSAGE: {
    SEND: 'message.send',
    SEND_CAMERA: 'message.send-camera',
  },
  CONDITION: {
    ONLY_CONTINUE_IF: 'condition.only-continue-if',
    CHECK_TIME: 'condition.check-time',
    IF_THEN_ELSE: 'condition.if-then-else',
  },
  USER: {
    SET_SEEN_AT_HOME: 'user.set-seen-at-home',
    SET_OUT_OF_HOME: 'user.set-out-of-home',
    CHECK_PRESENCE: 'user.check-presence',
  },
  HOUSE: {
    IS_EMPTY: 'house.is-empty',
    IS_NOT_EMPTY: 'house.is-not-empty',
  },
  HTTP: {
    REQUEST: 'http.request',
  },
  ECOWATT: {
    CONDITION: 'ecowatt.condition',
  },
  EDF_TEMPO: {
    CONDITION: 'edf-tempo.condition',
  },
  MQTT: {
    SEND: 'mqtt.send',
  },
  ZIGBEE2MQTT: {
    SEND: 'zigbee2mqtt.send',
  },
  MUSIC: {
    PLAY_NOTIFICATION: 'music.play-notification',
  },
  SMS: {
    SEND: 'sms.send',
  },
};

// List of actions that can be used as conditions
const CONDITION_ACTIONS = [
  ACTIONS.CONDITION.CHECK_TIME,
  ACTIONS.CONDITION.ONLY_CONTINUE_IF,
  ACTIONS.EDF_TEMPO.CONDITION,
  ACTIONS.ALARM.CHECK_ALARM_MODE,
  ACTIONS.CALENDAR.IS_EVENT_RUNNING,
  ACTIONS.ECOWATT.CONDITION,
  ACTIONS.HOUSE.IS_EMPTY,
  ACTIONS.HOUSE.IS_NOT_EMPTY,
];

const INTENTS = {
  LIGHT: {
    TURN_ON: 'intent.light.turn-on',
    TURN_OFF: 'intent.light.turn-off',
  },
  TEMPERATURE_SENSOR: {
    GET_IN_ROOM: 'intent.temperature-sensor.get-in-room',
  },
  HUMIDITY_SENSOR: {
    GET_IN_ROOM: 'intent.humidity-sensor.get-in-room',
  },
  WEATHER: {
    GET: 'intent.weather.get',
    TOMORROW: 'intent.weather.tomorrow',
    AFTER_TOMORROW: 'intent.weather.after-tomorrow',
    DAY: 'intent.weather.day',
  },
  CAMERA: {
    GET_IMAGE: 'intent.camera.get-image',
  },
  SCENE: {
    START: 'intent.scene.start',
  },
  SWITCH: {
    TURN_ON: 'intent.switch.turn-on',
    TURN_OFF: 'intent.switch.turn-off',
  },
};

const DEVICE_FEATURE_CATEGORIES = {
  CHILD_LOCK: 'child-lock',
  AIRQUALITY_SENSOR: 'airquality-sensor',
  AIR_CONDITIONING: 'air-conditioning',
  ANGLE_SENSOR: 'angle-sensor',
  BATTERY: 'battery',
  BATTERY_LOW: 'battery-low',
  BUTTON: 'button',
  CAMERA: 'camera',
  CUBE: 'cube',
  CURRENCY: 'currency',
  CO_SENSOR: 'co-sensor',
  CO2_SENSOR: 'co2-sensor',
  COUNTER_SENSOR: 'counter-sensor',
  CURTAIN: 'curtain',
  DATA: 'data',
  DATARATE: 'datarate',
  DEVICE_TEMPERATURE_SENSOR: 'device-temperature-sensor',
  DISTANCE_SENSOR: 'distance-sensor',
  DURATION: 'duration',
  ELECTRICAL_VEHICLE_BATTERY: 'electrical-vehicle-battery',
  ELECTRICAL_VEHICLE_CHARGE: 'electrical-vehicle-charge',
  ELECTRICAL_VEHICLE_DRIVE: 'electrical-vehicle-drive',
  ELECTRICAL_VEHICLE_CONSUMPTION: 'electrical-vehicle-consumption',
  ELECTRICAL_VEHICLE_STATE: 'electrical-vehicle-state',
  ELECTRICAL_VEHICLE_CLIMATE: 'electrical-vehicle-climate',
  ELECTRICAL_VEHICLE_COMMAND: 'electrical-vehicle-command',
  ENERGY_SENSOR: 'energy-sensor',
  ENERGY_PRODUCTION_SENSOR: 'energy-production-sensor',
  HEATER: 'heater',
  HUMIDITY_SENSOR: 'humidity-sensor',
  LEAK_SENSOR: 'leak-sensor',
  LIGHT: 'light',
  LIGHT_SENSOR: 'light-sensor',
  LEVEL_SENSOR: 'level-sensor',
  MOTION_SENSOR: 'motion-sensor',
  MUSIC: 'music',
  NOISE_SENSOR: 'noise-sensor',
  OPENING_SENSOR: 'opening-sensor',
  PM25_SENSOR: 'pm25-sensor',
  PM10_SENSOR: 'pm10-sensor',
  FORMALDEHYD_SENSOR: 'formaldehyd-sensor',
  PRECIPITATION_SENSOR: 'precipitation-sensor',
  PRESENCE_SENSOR: 'presence-sensor',
  PRESSURE_SENSOR: 'pressure-sensor',
  RAIN_SENSOR: 'rain-sensor',
  RISK: 'risk',
  SHUTTER: 'shutter',
  SIGNAL: 'signal',
  SIREN: 'siren',
  SISMIC_SENSOR: 'sismic-sensor',
  SMOKE_SENSOR: 'smoke-sensor',
  SOIL_MOISTURE_SENSOR: 'soil-moisture-sensor',
  SURFACE: 'surface',
  SWITCH: 'switch',
  SPEED_SENSOR: 'speed-sensor',
  TAMPER: 'tamper',
  TELEINFORMATION: 'teleinformation',
  TELEVISION: 'television',
  TEMPERATURE_SENSOR: 'temperature-sensor',
  THERMOSTAT: 'thermostat',
  UNKNOWN: 'unknown',
  UV_SENSOR: 'uv-sensor',
  VIBRATION_SENSOR: 'vibration-sensor',
  VOC_SENSOR: 'voc-sensor',
  VOC_INDEX_SENSOR: 'voc-index-sensor',
  VOC_MATTER_INDEX_SENSOR: 'voc-matter-index-sensor',
  VOLUME_SENSOR: 'volume-sensor',
  TEXT: 'text',
  INPUT: 'input',
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
  TEMPERATURE_SENSOR: {
    MIN: 'min',
    MAX: 'max',
    AVERAGE: 'average',
  },
  SWITCH: {
    BINARY: 'binary',
    POWER: 'power',
    ENERGY: 'energy',
    VOLTAGE: 'voltage',
    CURRENT: 'current',
    BURGLAR: 'burglar',
    DIMMER: 'dimmer',
    TARGET_CURRENT: 'target-current',
  },
  CAMERA: {
    IMAGE: 'image',
  },
  SIREN: {
    BINARY: 'binary',
    LMH_VOLUME: 'lmh_volume',
    MELODY: 'melody',
  },
  CHILD_LOCK: {
    BINARY: 'binary',
  },
  CUBE: {
    MODE: 'mode',
    ROTATION: 'rotation',
  },
  BATTERY: {
    INTEGER: 'integer',
  },
  BATTERY_LOW: {
    BINARY: 'binary',
  },
  VIBRATION_SENSOR: {
    BINARY: 'binary',
    STATUS: 'status',
    TILT_ANGLE: 'tilt-angle',
    ACCELERATION_X: 'acceleration-x',
    ACCELERATION_Y: 'acceleration-y',
    ACCELERATION_Z: 'acceleration-z',
    ANGLE_X: 'angle-x',
    ANGLE_Y: 'angle-y',
    ANGLE_Z: 'angle-z',
    BED_ACTIVITY: 'bed-activity',
  },
  BUTTON: {
    CLICK: 'click',
    PUSH: 'push',
  },
  SIGNAL: {
    QUALITY: 'integer',
  },
  AIR_CONDITIONING: {
    BINARY: 'binary',
    MODE: 'mode',
    TARGET_TEMPERATURE: 'target-temperature',
  },
  HEATER: {
    PILOT_WIRE_MODE: 'pilot-wire-mode',
  },
  SURFACE: {
    DECIMAL: 'decimal',
  },
  TAMPER: {
    BINARY: 'binary',
  },
  TELEVISION: {
    BINARY: 'binary',
    SOURCE: 'source',
    GUIDE: 'guide',
    MENU: 'menu',
    TOOLS: 'tools',
    INFO: 'info',
    ENTER: 'enter',
    RETURN: 'return',
    EXIT: 'exit',
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down',
    CHANNEL_UP: 'channel-up',
    CHANNEL_DOWN: 'channel-down',
    CHANNEL_PREVIOUS: 'channel-previous',
    CHANNEL: 'channel',
    VOLUME_UP: 'volume-up',
    VOLUME_DOWN: 'volume-down',
    VOLUME_MUTE: 'volume-mute',
    VOLUME: 'volume',
    PLAY: 'play',
    PAUSE: 'pause',
    STOP: 'stop',
    PREVIOUS: 'previous',
    NEXT: 'next',
    REWIND: 'rewind',
    FORWARD: 'forward',
    RECORD: 'record',
  },
  MUSIC: {
    VOLUME: 'volume',
    PLAY: 'play',
    PAUSE: 'pause',
    PREVIOUS: 'previous',
    NEXT: 'next',
    PLAYBACK_STATE: 'playback_state',
    PLAY_NOTIFICATION: 'play_notification',
  },
  ENERGY_SENSOR: {
    BINARY: 'binary',
    POWER: 'power',
    ENERGY: 'energy',
    VOLTAGE: 'voltage',
    CURRENT: 'current',
    INDEX: 'index',
    DAILY_CONSUMPTION: 'daily-consumption',
    DAILY_CONSUMPTION_COST: 'daily-consumption-cost',
    THIRTY_MINUTES_CONSUMPTION: 'thirty-minutes-consumption',
    THIRTY_MINUTES_CONSUMPTION_COST: 'thirty-minutes-consumption-cost',
  },
  ENERGY_PRODUCTION_SENSOR: {
    INDEX: 'index',
    DAILY_PRODUCTION: 'daily-production',
    DAILY_PRODUCTION_REVENUE: 'daily-production-revenue',
    THIRTY_MINUTES_PRODUCTION: 'thirty-minutes-production',
    THIRTY_MINUTES_PRODUCTION_REVENUE: 'thirty-minutes-production-revenue',
  },
  TELEINFORMATION: {
    BINARY: 'binary',
    EAST: 'east',
    EAIT: 'eait',
    EASF01: 'easf01',
    EASF02: 'easf02',
    EASF03: 'easf03',
    EASF04: 'easf04',
    EASF05: 'easf05',
    EASF06: 'easf06',
    EASF07: 'easf07',
    EASF08: 'easf08',
    EASF09: 'easf09',
    EASF10: 'easf10',
    PREF: 'pref',
    PCOUP: 'pcoup',
    VTIC: 'vtic',
    CCASN: 'ccasn',
    CCASN_1: 'ccasn_1',
    UMOY1: 'umoy1',
    UMOY2: 'umoy2',
    UMOY3: 'umoy3',
    ERQ1: 'erq1',
    ERQ2: 'erq2',
    ERQ3: 'erq3',
    ERQ4: 'erq4',
    IRMS1: 'irms1',
    IRMS2: 'irms2',
    IRMS3: 'irms3',
    URMS1: 'urms1',
    URMS2: 'urms2',
    URMS3: 'urms3',
    EASD01: 'easd01',
    EASD02: 'easd02',
    EASD03: 'easd03',
    EASD04: 'easd04',
    NTARF: 'ntarf',
    CCAIN: 'ccain',
    CCAIN_1: 'ccain_1',
    SINSTI: 'sinsti',
    SMAXIN: 'smaxin',
    SMAXIN_1: 'smaxin_1',
    SMAXN: 'smaxn',
    SMAXN2: 'smaxn2',
    SMAXN3: 'smaxn3',
    SINSTS: 'sinsts',
    SINSTS2: 'sinsts2',
    SINSTS3: 'sinsts3',
    SMAXN_1: 'smaxn_1',
    SMAXN2_1: 'smaxn2_1',
    SMAXN3_1: 'smaxn3_1',
    HHPHC: 'hhphc',
    IMAX: 'imax',
    ADPS: 'adps',
    IMAX2: 'imax2',
    IMAX3: 'imax3',
    ADIR1: 'adir1',
    ADIR2: 'adir2',
    ADIR3: 'adir3',
  },
  SPEED_SENSOR: {
    DECIMAL: 'decimal',
    INTEGER: 'integer',
  },
  UV_SENSOR: {
    INTEGER: 'integer',
  },
  CURRENCY: {
    DECIMAL: 'decimal',
  },
  PRECIPITATION_SENSOR: {
    DECIMAL: 'decimal',
    INTEGER: 'integer',
  },
  VOLUME_SENSOR: {
    DECIMAL: 'decimal',
    INTEGER: 'integer',
  },
  DURATION: {
    DECIMAL: 'decimal',
    INTEGER: 'integer',
  },
  VOC_SENSOR: {
    DECIMAL: 'decimal',
  },
  VOC_INDEX_SENSOR: {
    INTEGER: 'integer',
  },
  SHUTTER: {
    STATE: 'state',
    POSITION: 'position',
  },
  CURTAIN: {
    STATE: 'state',
    POSITION: 'position',
  },
  DATA: {
    SIZE: 'size',
  },
  DATARATE: {
    RATE: 'rate',
  },
  UNKNOWN: {
    UNKNOWN: 'unknown',
  },
  THERMOSTAT: {
    TARGET_TEMPERATURE: 'target-temperature',
  },
  AIRQUALITY_SENSOR: {
    AQI: 'aqi',
  },
  TEXT: {
    TEXT: 'text',
  },
  RISK: {
    INTEGER: 'integer',
  },
  INPUT: {
    BINARY: 'binary',
  },
  LEVEL_SENSOR: {
    // Types used by the Tuya ME201WZ in Zigbee2mqtt
    LIQUID_STATE: 'liquid-state',
    LIQUID_LEVEL_PERCENT: 'liquid-level-percent',
    LIQUID_DEPTH: 'liquid-depth',
  },
  ELECTRICAL_VEHICLE_BATTERY: {
    // Features related to the battery state and metrics of the vehicle
    BATTERY_ENERGY_REMAINING: 'battery-energy-remaining', // Remaining energy in the battery in kWh (integer - sensor)
    BATTERY_LEVEL: 'battery-level', // Battery state of charge in percent (integer - sensor)
    BATTERY_POWER: 'battery-power', // Instantaneous battery power in W (integer - sensor)
    BATTERY_RANGE_ESTIMATE: 'battery-range-estimate', // Estimated remaining range in km or miles (integer - sensor)
    BATTERY_TEMPERATURE: 'battery-temperature', // Battery temperature in °C (integer - sensor)
    BATTERY_VOLTAGE: 'battery-voltage', // Battery voltage in V (integer - sensor)
  },
  ELECTRICAL_VEHICLE_CHARGE: {
    // Features related to the charging process and charge control
    CHARGE_CURRENT: 'charge-current', // Current delivered during charging in A (integer - sensor)
    CHARGE_ENERGY_ADDED_TOTAL: 'charge-energy-added-total', // Total energy added during all charge sessions in kWh (integer - sensor)
    CHARGE_ENERGY_CONSUMPTION_TOTAL: 'charge-energy-consumption-total', // Total energy consumed during all charge sessions in kWh (integer - sensor)
    CHARGE_ON: 'charge-on', // Charging state (binary - command with return status)
    CHARGE_POWER: 'charge-power', // Instantaneous charging power in W (integer - sensor)
    CHARGE_VOLTAGE: 'charge-voltage', // Charging voltage in V (integer - sensor)
    LAST_CHARGE_ENERGY_ADDED: 'last-charge-energy-added', // Energy added in the last charge session in kWh (integer - sensor)
    LAST_CHARGE_ENERGY_CONSUMPTION: 'last-charge-energy-consumption', // Energy consumed in the last charge session in kWh (integer - sensor)
    PLUGGED: 'plugged', // Whether the vehicle is plugged in (binary - sensor)
    TARGET_CHARGE_LIMIT: 'target-charge-limit', // Target state of charge limit in percent (integer - command)
    TARGET_CURRENT: 'target-current', // Target charging current in A (integer - command)
  },
  ELECTRICAL_VEHICLE_CLIMATE: {
    // Features related to the vehicle's climate control
    CLIMATE_ON: 'climate-on', // Climate system activation (binary - command with return status)
    INDOOR_TEMPERATURE: 'indoor-temperature', // Cabin temperature in °C (integer - sensor)
    TARGET_TEMPERATURE: 'target-temperature', // Desired cabin temperature in °C (integer - command)
  },
  ELECTRICAL_VEHICLE_COMMAND: {
    // General remote commands for the vehicle
    ALARM: 'alarm', // Enable/Disable alarm (binary - command with return status)
    LOCK: 'lock', // Lock/unlock the vehicle (binary - command with return status)
  },
  ELECTRICAL_VEHICLE_DRIVE: {
    // Features related to driving and trip statistics
    DRIVE_ENERGY_CONSUMPTION_TOTAL: 'drive-energy-consumption-total', // Total energy consumed while all trips in kWh (integer - sensor)
    SPEED: 'speed', // Current speed of the vehicle in km/h or mi/h (integer - sensor)
  },
  ELECTRICAL_VEHICLE_CONSUMPTION: {
    // Features related to energy consumption and efficiency
    ENERGY_CONSUMPTION: 'energy-consumption', // Instantaneous or average energy consumption in Wh/km, Wh/mi, kWh/100km, kWh/100mi (integer - sensor)
    ENERGY_EFFICIENCY: 'energy-efficiency', // Energy efficiency metric in km/kWh or mi/kWh (integer - sensor)
  },
  ELECTRICAL_VEHICLE_STATE: {
    // Features related to the physical state of the vehicle
    DOOR_OPENED: 'door-opened', // Door open state (binary - sensor)
    ODOMETER: 'odometer', // Total distance traveled in km or miles (integer - sensor)
    TIRE_PRESSURE: 'tire-pressure', // Tire pressure in bar (decimal - sensor)
    WINDOW_OPENED: 'window-opened', // Window open state (binary - sensor)
  },
};

const DEVICE_FEATURE_UNITS = {
  // Temperature units
  CELSIUS: 'celsius',
  FAHRENHEIT: 'fahrenheit',
  KELVIN: 'kelvin',
  // Percentage units
  PERCENT: 'percent',
  // Pressure units
  PASCAL: 'pascal',
  HECTO_PASCAL: 'hPa',
  KILO_PASCAL: 'kPa',
  BAR: 'bar',
  PSI: 'psi',
  MILLIBAR: 'milli-bar',
  // Light units
  LUX: 'lux',
  // Concentration units
  PPM: 'ppm',
  PPB: 'ppb',
  PPT: 'ppt',
  // Power units
  WATT: 'watt',
  KILOWATT: 'kilowatt',
  WATT_HOUR: 'watt-hour',
  KILOWATT_HOUR: 'kilowatt-hour',
  MEGAWATT_HOUR: 'megawatt-hour',
  AMPERE: 'ampere',
  MILLI_AMPERE: 'milliampere',
  MILLI_VOLT: 'millivolt',
  VOLT: 'volt',
  KILOVOLT_AMPERE: 'kilovolt-ampere',
  VOLT_AMPERE: 'volt-ampere',
  VOLT_AMPERE_REACTIVE: 'volt-ampere-reactive',
  WATT_HOUR_PER_KM: 'watt-hour-per-km',
  KILOWATT_HOUR_PER_100_KM: 'kilowatt-hour-per-100-km',
  WATT_HOUR_PER_MILE: 'watt-hour-per-mile',
  KILOWATT_HOUR_PER_100_MILE: 'kilowatt-hour-per-100-mile',
  // Efficiency units
  KM_PER_KILOWATT_HOUR: 'km-per-kilowatt-hour',
  MILE_PER_KILOWATT_HOUR: 'mile-per-kilowatt-hour',
  // Length units
  MM: 'mm',
  CM: 'cm',
  M: 'm',
  KM: 'km',
  INCH: 'inch',
  FEET: 'feet',
  MILE: 'mile',
  // surface units
  SQUARE_CENTIMETER: 'square-centimeter',
  SQUARE_METER: 'square-meter',
  SQUARE_KILOMETER: 'square-kilometer',
  // Degree units
  DEGREE: 'degree',
  // Volume units
  LITER: 'liter',
  MILLILITER: 'milliliter',
  CUBIC_METER: 'cubicmeter',
  // Currency units
  EURO: 'euro',
  DOLLAR: 'dollar',
  BITCOIN: 'bitcoin',
  LITECOIN: 'litecoin',
  DOGECOIN: 'dogecoin',
  ETHEREUM: 'ethereum',
  POUND_STERLING: 'pound-sterling',
  // Speed units
  METER_PER_SECOND: 'meter-per-second',
  KILOMETER_PER_HOUR: 'kilometer-per-hour',
  FEET_PER_SECOND: 'feet-per-second',
  MILE_PER_HOUR: 'mile-per-hour',
  // Precipitation units
  MILLIMETER_PER_HOUR: 'millimeter-per-hour',
  MILLIMETER_PER_DAY: 'millimeter-per-day',
  // UV units
  UV_INDEX: 'uv-index',
  // Duration units
  MICROSECONDS: 'microseconds',
  MILLISECONDS: 'milliseconds',
  SECONDS: 'seconds',
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months',
  YEARS: 'years',
  // Data units
  BIT: 'bit',
  KILOBIT: 'kilobit',
  MEGABIT: 'megabit',
  GIGABIT: 'gigabit',
  BYTE: 'byte',
  KILOBYTE: 'kilobyte',
  MEGABYTE: 'megabyte',
  GIGABYTE: 'gigabyte',
  TERABYTE: 'terabyte',
  // Data rate units
  BITS_PER_SECOND: 'bits-per-second',
  KILOBITS_PER_SECOND: 'kilobits-per-second',
  MEGABITS_PER_SECOND: 'megabits-per-second',
  GIGABITS_PER_SECOND: 'gigabits-per-second',
  BYTES_PER_SECOND: 'bytes-per-second',
  KILOBYTES_PER_SECOND: 'kilobytes-per-second',
  MEGABYTES_PER_SECOND: 'megabytes-per-second',
  GIGABYTES_PER_SECOND: 'gigabytes-per-second',
  // Airquality Index
  AQI: 'aqi',
  // For air quality (pm2.5, pm10, formaldehyd)
  MILLIGRAM_PER_CUBIC_METER: 'milligram-per-cubic-meter',
  MICROGRAM_PER_CUBIC_METER: 'microgram-per-cubic-meter',
  NANOGRAM_PER_CUBIC_METER: 'nanogram-per-cubic-meter',
  PARTICLES_PER_CUBIC_METER: 'particles-per-cubic-meter',
  BECQUEREL_PER_CUBIC_METER: 'becquerel-per-cubic-meter',
  // Noise units
  DECIBEL: 'decibel',
};

const WEATHER_UNITS = {
  METRIC: 'metric',
};

const DEVICE_FEATURE_UNITS_BY_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: [
    DEVICE_FEATURE_UNITS.AMPERE,
    DEVICE_FEATURE_UNITS.MILLI_VOLT,
    DEVICE_FEATURE_UNITS.VOLT,
    DEVICE_FEATURE_UNITS.WATT,
    DEVICE_FEATURE_UNITS.KILOWATT,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  ],
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_UNITS.PERCENT],
  [DEVICE_FEATURE_CATEGORIES.CO_SENSOR]: [DEVICE_FEATURE_UNITS.PPM],
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: [DEVICE_FEATURE_UNITS.PPM],
  [DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR]: [
    DEVICE_FEATURE_UNITS.MM,
    DEVICE_FEATURE_UNITS.CM,
    DEVICE_FEATURE_UNITS.M,
    DEVICE_FEATURE_UNITS.KM,
    DEVICE_FEATURE_UNITS.INCH,
    DEVICE_FEATURE_UNITS.FEET,
    DEVICE_FEATURE_UNITS.MILE,
  ],
  [DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR]: [
    DEVICE_FEATURE_UNITS.MM,
    DEVICE_FEATURE_UNITS.CM,
    DEVICE_FEATURE_UNITS.M,
    DEVICE_FEATURE_UNITS.KM,
    DEVICE_FEATURE_UNITS.INCH,
    DEVICE_FEATURE_UNITS.FEET,
    DEVICE_FEATURE_UNITS.MILE,
    DEVICE_FEATURE_UNITS.PERCENT,
  ],
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: [DEVICE_FEATURE_UNITS.PERCENT],
  [DEVICE_FEATURE_CATEGORIES.SOIL_MOISTURE_SENSOR]: [DEVICE_FEATURE_UNITS.PERCENT],
  [DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]: [DEVICE_FEATURE_UNITS.LUX],
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: [
    DEVICE_FEATURE_UNITS.PASCAL,
    DEVICE_FEATURE_UNITS.HECTO_PASCAL,
    DEVICE_FEATURE_UNITS.KILO_PASCAL,
    DEVICE_FEATURE_UNITS.BAR,
    DEVICE_FEATURE_UNITS.PSI,
    DEVICE_FEATURE_UNITS.MILLIBAR,
  ],
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: [
    DEVICE_FEATURE_UNITS.CELSIUS,
    DEVICE_FEATURE_UNITS.FAHRENHEIT,
    DEVICE_FEATURE_UNITS.KELVIN,
  ],
  [DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR]: [
    DEVICE_FEATURE_UNITS.CELSIUS,
    DEVICE_FEATURE_UNITS.FAHRENHEIT,
  ],
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: [
    DEVICE_FEATURE_UNITS.MILLI_AMPERE,
    DEVICE_FEATURE_UNITS.AMPERE,
    DEVICE_FEATURE_UNITS.MILLI_VOLT,
    DEVICE_FEATURE_UNITS.VOLT,
    DEVICE_FEATURE_UNITS.WATT,
    DEVICE_FEATURE_UNITS.KILOWATT,
    DEVICE_FEATURE_UNITS.WATT_HOUR,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    DEVICE_FEATURE_UNITS.MEGAWATT_HOUR,
    DEVICE_FEATURE_UNITS.KILOVOLT_AMPERE,
    DEVICE_FEATURE_UNITS.VOLT_AMPERE,
    DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
    DEVICE_FEATURE_UNITS.EURO,
    DEVICE_FEATURE_UNITS.DOLLAR,
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_BATTERY]: [
    DEVICE_FEATURE_UNITS.CELSIUS,
    DEVICE_FEATURE_UNITS.FAHRENHEIT,
    DEVICE_FEATURE_UNITS.KILOWATT,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    DEVICE_FEATURE_UNITS.KM,
    DEVICE_FEATURE_UNITS.MILE,
    DEVICE_FEATURE_UNITS.PERCENT,
    DEVICE_FEATURE_UNITS.VOLT,
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE]: [
    DEVICE_FEATURE_UNITS.AMPERE,
    DEVICE_FEATURE_UNITS.KILOWATT,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    DEVICE_FEATURE_UNITS.MEGAWATT_HOUR,
    DEVICE_FEATURE_UNITS.PERCENT,
    DEVICE_FEATURE_UNITS.VOLT,
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CLIMATE]: [
    DEVICE_FEATURE_UNITS.CELSIUS,
    DEVICE_FEATURE_UNITS.FAHRENHEIT,
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_DRIVE]: [
    DEVICE_FEATURE_UNITS.MILE_PER_HOUR,
    DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    DEVICE_FEATURE_UNITS.WATT_HOUR_PER_KM,
    DEVICE_FEATURE_UNITS.WATT_HOUR_PER_MILE,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_KM,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_MILE,
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CONSUMPTION]: [
    DEVICE_FEATURE_UNITS.WATT_HOUR_PER_KM,
    DEVICE_FEATURE_UNITS.WATT_HOUR_PER_MILE,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_KM,
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_MILE,
    DEVICE_FEATURE_UNITS.KM_PER_KILOWATT_HOUR,
    DEVICE_FEATURE_UNITS.MILE_PER_KILOWATT_HOUR,
  ],
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE]: [
    DEVICE_FEATURE_UNITS.KM,
    DEVICE_FEATURE_UNITS.MILE,
    DEVICE_FEATURE_UNITS.BAR,
    DEVICE_FEATURE_UNITS.PSI,
    DEVICE_FEATURE_UNITS.KILO_PASCAL,
  ],
  [DEVICE_FEATURE_CATEGORIES.VOLUME_SENSOR]: [
    DEVICE_FEATURE_UNITS.LITER,
    DEVICE_FEATURE_UNITS.MILLILITER,
    DEVICE_FEATURE_UNITS.CUBIC_METER,
  ],
  [DEVICE_FEATURE_CATEGORIES.CURRENCY]: [
    DEVICE_FEATURE_UNITS.EURO,
    DEVICE_FEATURE_UNITS.DOLLAR,
    DEVICE_FEATURE_UNITS.BITCOIN,
    DEVICE_FEATURE_UNITS.LITECOIN,
    DEVICE_FEATURE_UNITS.ETHEREUM,
    DEVICE_FEATURE_UNITS.DOGECOIN,
    DEVICE_FEATURE_UNITS.POUND_STERLING,
  ],
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: [
    DEVICE_FEATURE_UNITS.METER_PER_SECOND,
    DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR,
  ],
  [DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR]: [
    DEVICE_FEATURE_UNITS.MILLIMETER_PER_HOUR,
    DEVICE_FEATURE_UNITS.MILLIMETER_PER_DAY,
    DEVICE_FEATURE_UNITS.MILLI_VOLT,
  ],
  [DEVICE_FEATURE_CATEGORIES.UV_SENSOR]: [DEVICE_FEATURE_UNITS.UV_INDEX],
  [DEVICE_FEATURE_CATEGORIES.DURATION]: [
    DEVICE_FEATURE_UNITS.MICROSECONDS,
    DEVICE_FEATURE_UNITS.MILLISECONDS,
    DEVICE_FEATURE_UNITS.SECONDS,
    DEVICE_FEATURE_UNITS.MINUTES,
    DEVICE_FEATURE_UNITS.HOURS,
    DEVICE_FEATURE_UNITS.DAYS,
    DEVICE_FEATURE_UNITS.WEEKS,
    DEVICE_FEATURE_UNITS.MONTHS,
    DEVICE_FEATURE_UNITS.YEARS,
  ],
  [DEVICE_FEATURE_CATEGORIES.VOC_SENSOR]: [DEVICE_FEATURE_UNITS.PPB],
  [DEVICE_FEATURE_CATEGORIES.DATA]: [
    DEVICE_FEATURE_UNITS.BIT,
    DEVICE_FEATURE_UNITS.KILOBIT,
    DEVICE_FEATURE_UNITS.MEGABIT,
    DEVICE_FEATURE_UNITS.GIGABIT,
    DEVICE_FEATURE_UNITS.BYTE,
    DEVICE_FEATURE_UNITS.KILOBYTE,
    DEVICE_FEATURE_UNITS.MEGABYTE,
    DEVICE_FEATURE_UNITS.GIGABYTE,
    DEVICE_FEATURE_UNITS.TERABYTE,
  ],
  [DEVICE_FEATURE_CATEGORIES.DATARATE]: [
    DEVICE_FEATURE_UNITS.BITS_PER_SECOND,
    DEVICE_FEATURE_UNITS.KILOBITS_PER_SECOND,
    DEVICE_FEATURE_UNITS.MEGABITS_PER_SECOND,
    DEVICE_FEATURE_UNITS.GIGABITS_PER_SECOND,
    DEVICE_FEATURE_UNITS.BYTES_PER_SECOND,
    DEVICE_FEATURE_UNITS.KILOBYTES_PER_SECOND,
    DEVICE_FEATURE_UNITS.MEGABYTES_PER_SECOND,
    DEVICE_FEATURE_UNITS.GIGABYTES_PER_SECOND,
  ],
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: [DEVICE_FEATURE_UNITS.CELSIUS, DEVICE_FEATURE_UNITS.FAHRENHEIT],
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: [DEVICE_FEATURE_UNITS.CELSIUS, DEVICE_FEATURE_UNITS.FAHRENHEIT],
  [DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]: [DEVICE_FEATURE_UNITS.AQI],
  [DEVICE_FEATURE_CATEGORIES.PM25_SENSOR]: [
    [DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER],
    [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER],
    [DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER],
  ],
  [DEVICE_FEATURE_CATEGORIES.PM10_SENSOR]: [
    [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER],
    [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER],
    [DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER],
  ],
  [DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR]: [
    [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER],
    [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER],
    [DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER],
  ],
  [DEVICE_FEATURE_CATEGORIES.SURFACE]: [
    DEVICE_FEATURE_UNITS.SQUARE_CENTIMETER,
    DEVICE_FEATURE_UNITS.SQUARE_METER,
    DEVICE_FEATURE_UNITS.SQUARE_KILOMETER,
  ],
};

const MEASUREMENT_UNITS = {
  US: 'us',
  METRIC: 'metric',
};

const ACTIONS_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
};

const DEVICE_POLL_FREQUENCIES = {
  EVERY_MINUTES: 60 * 1000,
  EVERY_30_SECONDS: 30 * 1000,
  EVERY_15_SECONDS: 15 * 1000,
  EVERY_10_SECONDS: 10 * 1000,
  EVERY_2_SECONDS: 2 * 1000,
  EVERY_SECONDS: 1 * 1000,
};

const DEVICE_ROTATION = {
  DEGREES_0: '0',
  DEGREES_90: '90',
  DEGREES_180: '180',
  DEGREES_270: '270',
};

const WEBSOCKET_MESSAGE_TYPES = {
  ALARM: {
    ARMING: 'alarm.arming',
    ARMED: 'alarm.armed',
    DISARMED: 'alarm.disarmed',
    PARTIALLY_ARMED: 'alarm.partial-arm',
    PANIC: 'alarm.panic',
  },
  BACKUP: {
    DOWNLOADED: 'backup.downloaded',
  },
  DEVICE: {
    NEW_STATE: 'device.new-state',
    NEW_STRING_STATE: 'device.new-string-state',
  },
  JOB: {
    NEW: 'job.new',
    UPDATED: 'job.updated',
  },
  MESSAGE: {
    NEW: 'message.new',
    SENT: 'message.sent',
  },
  AUTHENTICATION: {
    REQUEST: 'authenticate.request',
    CONNECTED: 'authentication.connected',
  },
  GATEWAY: {
    BACKUP_UPLOAD_PROGRESS: 'gateway.backup-upload-progress',
    BACKUP_DOWNLOAD_PROGRESS: 'gateway.backup-download-progress',
  },
  SCENE: {
    EXECUTING_ACTION: 'scene.executing-action',
    FINISHED_EXECUTING_ACTION: 'scene.finished-executing-action',
  },
  SYSTEM: {
    VACUUM_FINISHED: 'system.vacuum-finished',
    WATCHTOWER_LOG: 'system.watchtower-log',
  },
  LOCATION: {
    NEW: 'location.new',
  },
  USER_PRESENCE: {
    LEFT_HOME: 'user.left-home',
    BACK_HOME: 'user.back-home',
    SEEN_AT_HOME: 'user.seen-at-home',
  },
  LAN: {
    SCANNING: 'lan.scanning',
  },
  MQTT: {
    CONNECTED: 'mqtt.connected',
    ERROR: 'mqtt.error',
    INSTALLATION_STATUS: 'mqtt.install-status',
    DEBUG_NEW_MQTT_MESSAGE: 'mqtt.debug.new-mqtt-message',
  },
  ZWAVEJS_UI: {
    CONNECTED: 'zwavejs-ui.connected',
    ERROR: 'zwavejs-ui.error',
    SCAN_COMPLETED: 'zwavejs-ui.scan-completed',
  },
  ZIGBEE2MQTT: {
    DISCOVER: 'zigbee2mqtt.discover',
    STATUS_CHANGE: 'zigbee2mqtt.status-change',
    PERMIT_JOIN: 'zigbee2mqtt.permit-join',
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
  EWELINK: {
    CONNECTED: 'ewelink.connected',
    NEW_DEVICE: 'ewelink.new-device',
    ERROR: 'ewelink.error',
  },
  BROADLINK: {
    LEARN_MODE: 'broadlink.learn',
    SEND_MODE: 'broadlink.send',
  },
  TUYA: {
    STATUS: 'tuya.status',
    DISCOVER: 'tuya.discover',
  },
  NETATMO: {
    STATUS: 'netatmo.status',
    ERROR: {
      CONNECTED: 'netatmo.error-connected',
      CONNECTING: 'netatmo.error-connecting',
      PROCESSING_TOKEN: 'netatmo.error-processing-token',
    },
  },
  MELCLOUD: {
    STATUS: 'melcloud.status',
    DISCOVER: 'melcloud.discover',
  },
  NODERED: {
    STATUS_CHANGE: 'nodered.status-change',
    MQTT_ERROR: 'nodered.mqtt-error',
  },
};

const DASHBOARD_TYPE = {
  MAIN: 'main',
};

const DASHBOARD_VISIBILITY = {
  PRIVATE: 'private',
  PUBLIC: 'public',
};

const DASHBOARD_BOX_TYPE = {
  ALARM: 'alarm',
  WEATHER: 'weather',
  TEMPERATURE_IN_ROOM: 'temperature-in-room',
  HUMIDITY_IN_ROOM: 'humidity-in-room',
  USER_PRESENCE: 'user-presence',
  CAMERA: 'camera',
  DEVICES_IN_ROOM: 'devices-in-room',
  DEVICES: 'devices',
  CHART: 'chart',
  ECOWATT: 'ecowatt',
  EDF_TEMPO: 'edf-tempo',
  CLOCK: 'clock',
  SCENE: 'scene',
  MUSIC: 'music',
  GAUGE: 'gauge',
  ENERGY_CONSUMPTION: 'energy-consumption',
};

const ERROR_MESSAGES = {
  HOUSE_HAS_NO_COORDINATES: 'HOUSE_HAS_NO_COORDINATES',
  SERVICE_NOT_CONFIGURED: 'SERVICE_NOT_CONFIGURED',
  REQUEST_TO_THIRD_PARTY_FAILED: 'REQUEST_TO_THIRD_PARTY_FAILED',
  INVALID_ACCESS_TOKEN: 'INVALID_ACCESS_TOKEN',
  NO_CONNECTED_TO_THE_INTERNET: 'NO_CONNECTED_TO_THE_INTERNET',
};

const DEVICE_FEATURE_STATE_AGGREGATE_TYPES = {
  MONTHLY: 'monthly',
  DAILY: 'daily',
  HOURLY: 'hourly',
};

const DEFAULT_AGGREGATES_POLICY_IN_DAYS = {
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.HOURLY]: 6 * 30,
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.DAILY]: 365,
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.MONTHLY]: 5 * 365,
};

const JOB_TYPES = {
  HOURLY_DEVICE_STATE_AGGREGATE: 'hourly-device-state-aggregate',
  DAILY_DEVICE_STATE_AGGREGATE: 'daily-device-state-aggregate',
  MONTHLY_DEVICE_STATE_AGGREGATE: 'monthly-device-state-aggregate',
  GLADYS_GATEWAY_BACKUP: 'gladys-gateway-backup',
  DEVICE_STATES_PURGE_SINGLE_FEATURE: 'device-state-purge-single-feature',
  DEVICE_STATES_PURGE: 'device-state-purge',
  DEVICE_STATES_PURGE_ALL_SQLITE_STATES: 'device-state-purge-all-sqlite-states',
  VACUUM: 'vacuum',
  SERVICE_ZIGBEE2MQTT_BACKUP: 'service-zigbee2mqtt-backup',
  SERVICE_NODE_RED_BACKUP: 'service-node-red-backup',
  SERVICE_MATTER_BACKUP: 'service-matter-backup',
  MIGRATE_SQLITE_TO_DUCKDB: 'migrate-sqlite-to-duckdb',
  ENERGY_MONITORING_COST_CALCULATION_THIRTY_MINUTES: 'energy-monitoring-cost-calculation-thirty-minutes',
  ENERGY_MONITORING_COST_CALCULATION_YESTERDAY: 'energy-monitoring-cost-calculation-yesterday',
  ENERGY_MONITORING_COST_CALCULATION_BEGINNING: 'energy-monitoring-cost-calculation-beginning',
  ENERGY_MONITORING_COST_CALCULATION_RANGE: 'energy-monitoring-cost-calculation-range',
  ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_THIRTY_MINUTES: 'energy-monitoring-consumption-from-index-thirty-minutes',
  ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_BEGINNING: 'energy-monitoring-consumption-from-index-beginning',
  ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_RANGE: 'energy-monitoring-consumption-from-index-range',
  SERVICE_ENEDIS_SYNC: 'service-enedis-sync',
};

const JOB_STATUS = {
  IN_PROGRESS: 'in-progress',
  SUCCESS: 'success',
  FAILED: 'failed',
};

const JOB_ERROR_TYPES = {
  PURGED_WHEN_RESTARTED: 'purged-when-restarted',
  UNKNOWN_ERROR: 'unknown-error',
};

const DEFAULT_VALUE_HUMIDITY = {
  MINIMUM: 45,
  MAXIMUM: 60,
};

const DEFAULT_VALUE_TEMPERATURE = {
  MINIMUM: 17,
  MAXIMUM: 24,
};

const ALARM_MODES = {
  DISARMED: 'disarmed',
  ARMED: 'armed',
  PARTIALLY_ARMED: 'partially-armed',
  PANIC: 'panic',
};

const ENERGY_CONTRACT_TYPES = {
  // Generic base contract
  BASE: 'base',
  // Generic peak off peak contract
  PEAK_OFF_PEAK: 'peak-off-peak',
  // EDF Tempo
  EDF_TEMPO: 'edf-tempo',
};

const ENERGY_PRICE_TYPES = {
  CONSUMPTION: 'consumption',
  SUBSCRIPTION: 'subscription',
};

const ENERGY_PRICE_DAY_TYPES = {
  RED: 'red',
  BLUE: 'blue',
  WHITE: 'white',
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
const DASHBOARD_VISIBILITY_LIST = createList(DASHBOARD_VISIBILITY);
const DASHBOARD_BOX_TYPE_LIST = createList(DASHBOARD_BOX_TYPE);
const DEVICE_FEATURE_STATE_AGGREGATE_TYPES_LIST = createList(DEVICE_FEATURE_STATE_AGGREGATE_TYPES);
const JOB_TYPES_LIST = createList(JOB_TYPES);
const JOB_STATUS_LIST = createList(JOB_STATUS);
const JOB_ERROR_TYPES_LIST = createList(JOB_ERROR_TYPES);
const ALARM_MODES_LIST = createList(ALARM_MODES);
const ENERGY_CONTRACT_TYPES_LIST = createList(ENERGY_CONTRACT_TYPES);
const ENERGY_PRICE_TYPES_LIST = createList(ENERGY_PRICE_TYPES);
const ENERGY_PRICE_DAY_TYPES_LIST = createList(ENERGY_PRICE_DAY_TYPES);

module.exports.STATE = STATE;
module.exports.BUTTON_STATUS = BUTTON_STATUS;
module.exports.COVER_STATE = COVER_STATE;
module.exports.SIREN_LMH_VOLUME = SIREN_LMH_VOLUME;
module.exports.AC_MODE = AC_MODE;
module.exports.PILOT_WIRE_MODE = PILOT_WIRE_MODE;
module.exports.LIQUID_STATE = LIQUID_STATE;
module.exports.EVENTS = EVENTS;
module.exports.LIFE_EVENTS = LIFE_EVENTS;
module.exports.STATES = STATES;
module.exports.CONDITIONS = CONDITIONS;
module.exports.ACTIONS = ACTIONS;
module.exports.CONDITION_ACTIONS = CONDITION_ACTIONS;
module.exports.INTENTS = INTENTS;
module.exports.DEVICE_FEATURE_CATEGORIES = DEVICE_FEATURE_CATEGORIES;
module.exports.DEVICE_FEATURE_TYPES = DEVICE_FEATURE_TYPES;
module.exports.MEASUREMENT_UNITS = MEASUREMENT_UNITS;
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

module.exports.DEVICE_ROTATION = DEVICE_ROTATION;

module.exports.WEBSOCKET_MESSAGE_TYPES = WEBSOCKET_MESSAGE_TYPES;

module.exports.DEVICE_FEATURE_UNITS = DEVICE_FEATURE_UNITS;
module.exports.DEVICE_FEATURE_UNITS_LIST = DEVICE_FEATURE_UNITS_LIST;

module.exports.DEVICE_FEATURE_UNITS_BY_CATEGORY = DEVICE_FEATURE_UNITS_BY_CATEGORY;

module.exports.SERVICE_STATUS = SERVICE_STATUS;
module.exports.SERVICE_STATUS_LIST = createList(SERVICE_STATUS);

module.exports.SYSTEM_VARIABLE_NAMES = SYSTEM_VARIABLE_NAMES;

module.exports.DASHBOARD_TYPE = DASHBOARD_TYPE;
module.exports.DASHBOARD_VISIBILITY = DASHBOARD_VISIBILITY;
module.exports.DASHBOARD_VISIBILITY_LIST = DASHBOARD_VISIBILITY_LIST;
module.exports.DASHBOARD_TYPE_LIST = DASHBOARD_TYPE_LIST;
module.exports.DASHBOARD_BOX_TYPE = DASHBOARD_BOX_TYPE;
module.exports.DASHBOARD_BOX_TYPE_LIST = DASHBOARD_BOX_TYPE_LIST;

module.exports.ERROR_MESSAGES = ERROR_MESSAGES;

module.exports.WEATHER_UNITS = WEATHER_UNITS;

module.exports.DEVICE_FEATURE_STATE_AGGREGATE_TYPES = DEVICE_FEATURE_STATE_AGGREGATE_TYPES;
module.exports.DEVICE_FEATURE_STATE_AGGREGATE_TYPES_LIST = DEVICE_FEATURE_STATE_AGGREGATE_TYPES_LIST;
module.exports.DEFAULT_AGGREGATES_POLICY_IN_DAYS = DEFAULT_AGGREGATES_POLICY_IN_DAYS;

module.exports.JOB_TYPES = JOB_TYPES;
module.exports.JOB_TYPES_LIST = JOB_TYPES_LIST;
module.exports.JOB_STATUS = JOB_STATUS;
module.exports.JOB_STATUS_LIST = JOB_STATUS_LIST;
module.exports.JOB_ERROR_TYPES = JOB_ERROR_TYPES;
module.exports.JOB_ERROR_TYPES_LIST = JOB_ERROR_TYPES_LIST;

module.exports.DEFAULT_VALUE_HUMIDITY = DEFAULT_VALUE_HUMIDITY;
module.exports.DEFAULT_VALUE_TEMPERATURE = DEFAULT_VALUE_TEMPERATURE;

module.exports.ALARM_MODES = ALARM_MODES;
module.exports.ALARM_MODES_LIST = ALARM_MODES_LIST;

module.exports.MUSIC_PLAYBACK_STATE = MUSIC_PLAYBACK_STATE;
module.exports.OPENING_SENSOR_STATE = OPENING_SENSOR_STATE;

module.exports.ENERGY_CONTRACT_TYPES = ENERGY_CONTRACT_TYPES;
module.exports.ENERGY_CONTRACT_TYPES_LIST = ENERGY_CONTRACT_TYPES_LIST;
module.exports.ENERGY_PRICE_TYPES = ENERGY_PRICE_TYPES;
module.exports.ENERGY_PRICE_TYPES_LIST = ENERGY_PRICE_TYPES_LIST;
module.exports.ENERGY_PRICE_DAY_TYPES = ENERGY_PRICE_DAY_TYPES;
module.exports.ENERGY_PRICE_DAY_TYPES_LIST = ENERGY_PRICE_DAY_TYPES_LIST;

module.exports.LEVEL_MATTER_STATE = LEVEL_MATTER_STATE;
