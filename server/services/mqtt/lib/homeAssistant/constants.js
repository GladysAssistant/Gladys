const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  COVER_STATE,
} = require('../../../../utils/constants');

const HOME_ASSISTANT = {
  DISCOVERY_TOPIC_PREFIX: 'homeassistant',
  DISCOVERY_TOPIC: 'homeassistant/#',
  EXTERNAL_ID_PREFIX: 'homeassistant',
  DEVICE_PARAM_PREFIX: 'ha_discovery_config:',
  DISCOVERY_EMIT_DEBOUNCE_MS: 500,
  // The discovered devices are kept in memory and fed by whatever is published on the broker.
  // These bounds keep a misbehaving publisher flooding `homeassistant/#` from growing that memory
  // indefinitely. They are far above any realistic installation.
  MAX_DISCOVERED_DEVICES: 1000,
  MAX_ENTITIES_PER_DISCOVERED_DEVICE: 200,
};

// MQTT wildcards. They are only valid in a subscription filter, never in a concrete topic, so a
// discovery payload advertising one as a command topic is malformed: publishing to it is rejected
// by the broker anyway. A state topic is a filter, so it accepts "+" (see isSubscribableStateTopic)
const MQTT_WILDCARD_REGEX = /[+#]/;

// Components of the Home Assistant discovery protocol handled by Gladys
const SUPPORTED_COMPONENTS = ['sensor', 'binary_sensor', 'switch', 'light', 'cover', 'lock', 'climate', 'button'];

// Feature "properties" used as external_id suffixes for multi-feature components
const FEATURE_PROPERTIES = {
  STATE: 'state',
  BRIGHTNESS: 'brightness',
  COLOR_TEMP: 'color_temp',
  COLOR: 'color',
  POSITION: 'position',
  TARGET_TEMPERATURE: 'target_temperature',
  CURRENT_TEMPERATURE: 'current_temperature',
};

// See https://www.home-assistant.io/integrations/mqtt/#discovery-payload
// Abbreviations supported in Home Assistant discovery payloads
const ABBREVIATIONS = {
  act_t: 'action_topic',
  act_tpl: 'action_template',
  atype: 'automation_type',
  avty: 'availability',
  avty_mode: 'availability_mode',
  avty_t: 'availability_topic',
  avty_tpl: 'availability_template',
  bri_cmd_t: 'brightness_command_topic',
  bri_cmd_tpl: 'brightness_command_template',
  bri_scl: 'brightness_scale',
  bri_stat_t: 'brightness_state_topic',
  bri_tpl: 'brightness_template',
  bri_val_tpl: 'brightness_value_template',
  clrm: 'color_mode',
  clr_temp_cmd_t: 'color_temp_command_topic',
  clr_temp_cmd_tpl: 'color_temp_command_template',
  clr_temp_k: 'color_temp_kelvin',
  clr_temp_stat_t: 'color_temp_state_topic',
  clr_temp_tpl: 'color_temp_template',
  clr_temp_val_tpl: 'color_temp_value_template',
  cmd_t: 'command_topic',
  cmd_tpl: 'command_template',
  cmps: 'components',
  curr_temp_t: 'current_temperature_topic',
  curr_temp_tpl: 'current_temperature_template',
  dev: 'device',
  dev_cla: 'device_class',
  en: 'enabled_by_default',
  ent_cat: 'entity_category',
  ent_pic: 'entity_picture',
  exp_aft: 'expire_after',
  fx_cmd_t: 'effect_command_topic',
  fx_cmd_tpl: 'effect_command_template',
  fx_list: 'effect_list',
  fx_stat_t: 'effect_state_topic',
  fx_tpl: 'effect_template',
  fx_val_tpl: 'effect_value_template',
  frc_upd: 'force_update',
  ic: 'icon',
  json_attr_t: 'json_attributes_topic',
  json_attr_tpl: 'json_attributes_template',
  max_hum: 'max_humidity',
  max_k: 'max_kelvin',
  max_mirs: 'max_mireds',
  max_temp: 'max_temp',
  min_hum: 'min_humidity',
  min_k: 'min_kelvin',
  min_mirs: 'min_mireds',
  min_temp: 'min_temp',
  mode_cmd_t: 'mode_command_topic',
  mode_cmd_tpl: 'mode_command_template',
  mode_stat_t: 'mode_state_topic',
  mode_stat_tpl: 'mode_state_template',
  o: 'origin',
  obj_id: 'object_id',
  off_dly: 'off_delay',
  on_cmd_type: 'on_command_type',
  opt: 'optimistic',
  ops: 'options',
  pl: 'payload',
  pl_avail: 'payload_available',
  pl_cls: 'payload_close',
  pl_lock: 'payload_lock',
  pl_not_avail: 'payload_not_available',
  pl_off: 'payload_off',
  pl_on: 'payload_on',
  pl_open: 'payload_open',
  pl_prs: 'payload_press',
  pl_rst: 'payload_reset',
  pl_stop: 'payload_stop',
  pl_unlk: 'payload_unlock',
  pos_clsd: 'position_closed',
  pos_open: 'position_open',
  pos_t: 'position_topic',
  pos_tpl: 'position_template',
  p: 'platform',
  qos: 'qos',
  ret: 'retain',
  rgb_cmd_t: 'rgb_command_topic',
  rgb_cmd_tpl: 'rgb_command_template',
  rgb_stat_t: 'rgb_state_topic',
  rgb_val_tpl: 'rgb_value_template',
  set_pos_t: 'set_position_topic',
  set_pos_tpl: 'set_position_template',
  stat_cla: 'state_class',
  stat_closing: 'state_closing',
  stat_clsd: 'state_closed',
  stat_locked: 'state_locked',
  stat_off: 'state_off',
  stat_on: 'state_on',
  stat_open: 'state_open',
  stat_opening: 'state_opening',
  stat_stopped: 'state_stopped',
  stat_t: 'state_topic',
  stat_tpl: 'state_template',
  stat_unlocked: 'state_unlocked',
  stat_val_tpl: 'state_value_template',
  stype: 'subtype',
  sup_clrm: 'supported_color_modes',
  t: 'topic',
  temp_cmd_t: 'temperature_command_topic',
  temp_cmd_tpl: 'temperature_command_template',
  temp_stat_t: 'temperature_state_topic',
  temp_stat_tpl: 'temperature_state_template',
  temp_unit: 'temperature_unit',
  tilt_clsd_val: 'tilt_closed_value',
  tilt_cmd_t: 'tilt_command_topic',
  tilt_cmd_tpl: 'tilt_command_template',
  tilt_opnd_val: 'tilt_opened_value',
  tilt_status_t: 'tilt_status_topic',
  tilt_status_tpl: 'tilt_status_template',
  uniq_id: 'unique_id',
  unit_of_meas: 'unit_of_measurement',
  val_tpl: 'value_template',
};

// Abbreviations supported in the "device" object of discovery payloads
const DEVICE_ABBREVIATIONS = {
  cns: 'connections',
  cu: 'configuration_url',
  hw: 'hw_version',
  ids: 'identifiers',
  mdl: 'model',
  mdl_id: 'model_id',
  mf: 'manufacturer',
  name: 'name',
  sa: 'suggested_area',
  sn: 'serial_number',
  sw: 'sw_version',
};

// Abbreviations supported in the "origin" object of discovery payloads
const ORIGIN_ABBREVIATIONS = {
  name: 'name',
  sw: 'sw_version',
  url: 'support_url',
};

// Mapping between Home Assistant sensor device classes and Gladys features
const SENSOR_DEVICE_CLASSES = {
  temperature: { category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  humidity: { category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  moisture: { category: DEVICE_FEATURE_CATEGORIES.SOIL_MOISTURE_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  pressure: { category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  atmospheric_pressure: {
    category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  },
  illuminance: { category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  battery: { category: DEVICE_FEATURE_CATEGORIES.BATTERY, type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER },
  power: { category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER },
  apparent_power: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
  },
  energy: { category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX },
  voltage: { category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE },
  current: { category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT },
  carbon_dioxide: { category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  carbon_monoxide: { category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  pm25: { category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  pm10: { category: DEVICE_FEATURE_CATEGORIES.PM10_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  nitrogen_dioxide: { category: DEVICE_FEATURE_CATEGORIES.NO2_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  ozone: { category: DEVICE_FEATURE_CATEGORIES.O3_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  sulphur_dioxide: { category: DEVICE_FEATURE_CATEGORIES.SO2_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
  volatile_organic_compounds: {
    category: DEVICE_FEATURE_CATEGORIES.VOC_SENSOR,
    type: DEVICE_FEATURE_TYPES.VOC_SENSOR.DECIMAL,
  },
  signal_strength: { category: DEVICE_FEATURE_CATEGORIES.SIGNAL, type: DEVICE_FEATURE_TYPES.SIGNAL.QUALITY },
  speed: { category: DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR, type: DEVICE_FEATURE_TYPES.SPEED_SENSOR.DECIMAL },
  wind_speed: { category: DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR, type: DEVICE_FEATURE_TYPES.SPEED_SENSOR.DECIMAL },
  precipitation: {
    category: DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR,
    type: DEVICE_FEATURE_TYPES.PRECIPITATION_SENSOR.DECIMAL,
  },
  duration: { category: DEVICE_FEATURE_CATEGORIES.DURATION, type: DEVICE_FEATURE_TYPES.DURATION.DECIMAL },
  aqi: { category: DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR, type: DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI },
};

// Mapping between Home Assistant binary sensor device classes and Gladys categories.
// `inverted` is set when the Home Assistant "on" payload is the opposite of the Gladys value 1:
// Home Assistant reports "on" for an open door and for an unlocked lock, while Gladys uses 1 for
// "closed" on an opening sensor and 1 for "locked" on a lock.
// Home Assistant device classes without a Gladys equivalent (gas, problem, safety...) are left out
// on purpose: they fall back to the "unknown" category instead of borrowing an unrelated one.
const BINARY_SENSOR_DEVICE_CLASSES = {
  motion: { category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR },
  moving: { category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR },
  door: { category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR, inverted: true },
  window: { category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR, inverted: true },
  garage_door: { category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR, inverted: true },
  opening: { category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR, inverted: true },
  lock: { category: DEVICE_FEATURE_CATEGORIES.LOCK, inverted: true },
  // "is someone there right now": the Gladys `presence-sensor` category is the LAN/Bluetooth
  // "last seen" capability and renders as a relative timestamp, so both classes go to the motion
  // sensor category, like zigbee2mqtt does for the same exposes
  presence: { category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR },
  occupancy: { category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR },
  smoke: { category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR },
  carbon_monoxide: { category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR },
  moisture: { category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR },
  vibration: { category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR },
  tamper: { category: DEVICE_FEATURE_CATEGORIES.TAMPER },
  battery: { category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW },
  rain: { category: DEVICE_FEATURE_CATEGORIES.RAIN_SENSOR },
};

// Home Assistant cover device classes driving a curtain rather than a shutter. Every other class
// (blind, shade, awning, garage, gate, door...) stays on the shutter category.
const CURTAIN_COVER_DEVICE_CLASSES = ['curtain'];

// Default bounds of the light color temperature, in mireds and in Kelvin.
// See https://www.home-assistant.io/integrations/light.mqtt/
const COLOR_TEMP_BOUNDS = {
  MIN_MIREDS: 153,
  MAX_MIREDS: 500,
  MIN_KELVIN: 2000,
  MAX_KELVIN: 6535,
};

// Mapping between Home Assistant units of measurement and Gladys units
const UNITS = {
  '°C': DEVICE_FEATURE_UNITS.CELSIUS,
  '°F': DEVICE_FEATURE_UNITS.FAHRENHEIT,
  K: DEVICE_FEATURE_UNITS.KELVIN,
  '%': DEVICE_FEATURE_UNITS.PERCENT,
  Pa: DEVICE_FEATURE_UNITS.PASCAL,
  hPa: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
  kPa: DEVICE_FEATURE_UNITS.KILO_PASCAL,
  bar: DEVICE_FEATURE_UNITS.BAR,
  mbar: DEVICE_FEATURE_UNITS.MILLIBAR,
  psi: DEVICE_FEATURE_UNITS.PSI,
  lx: DEVICE_FEATURE_UNITS.LUX,
  W: DEVICE_FEATURE_UNITS.WATT,
  kW: DEVICE_FEATURE_UNITS.KILOWATT,
  Wh: DEVICE_FEATURE_UNITS.WATT_HOUR,
  kWh: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  MWh: DEVICE_FEATURE_UNITS.MEGAWATT_HOUR,
  V: DEVICE_FEATURE_UNITS.VOLT,
  mV: DEVICE_FEATURE_UNITS.MILLI_VOLT,
  A: DEVICE_FEATURE_UNITS.AMPERE,
  mA: DEVICE_FEATURE_UNITS.MILLI_AMPERE,
  ppm: DEVICE_FEATURE_UNITS.PPM,
  ppb: DEVICE_FEATURE_UNITS.PPB,
  'µg/m³': DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER,
  dB: DEVICE_FEATURE_UNITS.DECIBEL,
  'km/h': DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR,
  'mm/h': DEVICE_FEATURE_UNITS.MILLIMETER_PER_HOUR,
  'mm/d': DEVICE_FEATURE_UNITS.MILLIMETER_PER_DAY,
};

// Default payloads of the Home Assistant discovery protocol
const DEFAULT_PAYLOADS = {
  PAYLOAD_ON: 'ON',
  PAYLOAD_OFF: 'OFF',
  PAYLOAD_OPEN: 'OPEN',
  PAYLOAD_CLOSE: 'CLOSE',
  PAYLOAD_STOP: 'STOP',
  PAYLOAD_LOCK: 'LOCK',
  PAYLOAD_UNLOCK: 'UNLOCK',
  PAYLOAD_PRESS: 'PRESS',
  STATE_LOCKED: 'LOCKED',
  STATE_UNLOCKED: 'UNLOCKED',
  STATE_OPEN: 'open',
  STATE_OPENING: 'opening',
  STATE_CLOSED: 'closed',
  STATE_CLOSING: 'closing',
  STATE_STOPPED: 'stopped',
};

// Mapping between Home Assistant cover states and Gladys COVER_STATE
const COVER_STATE_BY_PAYLOAD_KEY = {
  state_open: COVER_STATE.OPEN,
  state_opening: COVER_STATE.OPEN,
  state_closed: COVER_STATE.CLOSE,
  state_closing: COVER_STATE.CLOSE,
  state_stopped: COVER_STATE.STOP,
};

module.exports = {
  HOME_ASSISTANT,
  MQTT_WILDCARD_REGEX,
  SUPPORTED_COMPONENTS,
  FEATURE_PROPERTIES,
  ABBREVIATIONS,
  DEVICE_ABBREVIATIONS,
  ORIGIN_ABBREVIATIONS,
  SENSOR_DEVICE_CLASSES,
  BINARY_SENSOR_DEVICE_CLASSES,
  CURTAIN_COVER_DEVICE_CLASSES,
  COLOR_TEMP_BOUNDS,
  UNITS,
  DEFAULT_PAYLOADS,
  COVER_STATE_BY_PAYLOAD_KEY,
};
