import dayjs from 'dayjs';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../server/utils/constants';

/**
 * Deterministic pseudo-UUID built from a string, so every entity of the demo
 * gets a stable id without hardcoding one per device. Ids only need to be
 * unique and stable inside the demo: nothing is ever persisted.
 */
const uuid = seed => {
  let hash = 0x811c9dc5;
  const hex = [];
  for (let i = 0; i < 32; i += 1) {
    const char = seed.charCodeAt(i % seed.length) + i;
    hash = Math.imul(hash ^ char, 0x01000193) >>> 0;
    hex.push(((hash >>> i % 24) & 0xf).toString(16));
  }
  const raw = hex.join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
};

const minutesAgo = minutes =>
  dayjs()
    .subtract(minutes, 'minute')
    .toISOString();

const hoursAgo = hours =>
  dayjs()
    .subtract(hours, 'hour')
    .toISOString();

const daysAgo = days =>
  dayjs()
    .subtract(days, 'day')
    .toISOString();

/**
 * Base builder of a device feature. Every builder below goes through it, so
 * all features carry the attributes the front expects (id, bounds, history
 * flags...) without repeating them in the house description.
 */
const feature = ({
  name,
  selector,
  category,
  type,
  last_value: lastValue,
  min = 0,
  max = 100,
  unit = null,
  read_only: readOnly = false,
  keep_history: keepHistory = true,
  has_feedback: hasFeedback = true,
  updated: updatedMinutesAgo = 4,
  ...rest
}) => ({
  id: uuid(selector),
  name,
  selector,
  category,
  type,
  min,
  max,
  unit,
  read_only: readOnly,
  keep_history: keepHistory,
  has_feedback: hasFeedback,
  last_value: lastValue,
  last_value_changed: minutesAgo(updatedMinutesAgo),
  ...rest
});

// --- Lights & switches ---------------------------------------------------

const lightBinary = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    min: 0,
    max: 1,
    last_value: value,
    ...options
  });

const lightBrightness = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    last_value: value,
    ...options
  });

const lightColor = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    min: 0,
    max: 16777215,
    last_value: value,
    ...options
  });

const lightTemperature = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    min: 0,
    max: 100,
    last_value: value,
    ...options
  });

const switchBinary = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    min: 0,
    max: 1,
    last_value: value,
    ...options
  });

const switchPower = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
    min: 0,
    max: 3500,
    read_only: true,
    last_value: value,
    ...options
  });

// --- Sensors -------------------------------------------------------------

const temperature = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    min: -30,
    max: 60,
    read_only: true,
    last_value: value,
    ...options
  });

const humidity = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    read_only: true,
    last_value: value,
    ...options
  });

const co2 = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.PPM,
    min: 0,
    max: 5000,
    read_only: true,
    last_value: value,
    ...options
  });

const battery = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
    type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    read_only: true,
    last_value: value,
    ...options
  });

const motion = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    min: 0,
    max: 1,
    read_only: true,
    last_value: value,
    ...options
  });

const presence = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    min: 0,
    max: 1,
    read_only: true,
    last_value: value,
    ...options
  });

const opening = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    min: 0,
    max: 1,
    read_only: true,
    last_value: value,
    ...options
  });

const leak = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    min: 0,
    max: 1,
    read_only: true,
    last_value: value,
    ...options
  });

const lightSensor = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.LUX,
    min: 0,
    max: 100000,
    read_only: true,
    last_value: value,
    ...options
  });

const airQuality = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
    type: DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI,
    min: 0,
    max: 500,
    read_only: true,
    last_value: value,
    ...options
  });

// --- Comfort & covers ----------------------------------------------------

const shutterState = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
    type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
    min: -1,
    max: 1,
    last_value: value,
    ...options
  });

const shutterPosition = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
    type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    last_value: value,
    ...options
  });

const thermostatTarget = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    min: 7,
    max: 30,
    last_value: value,
    ...options
  });

const acBinary = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
    min: 0,
    max: 1,
    last_value: value,
    ...options
  });

const acMode = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
    min: 0,
    max: 5,
    last_value: value,
    ...options
  });

const acTarget = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    min: 16,
    max: 30,
    last_value: value,
    ...options
  });

// --- Energy --------------------------------------------------------------

const energyPower = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
    min: 0,
    max: 12000,
    read_only: true,
    last_value: value,
    ...options
  });

const energyIndex = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    min: 0,
    max: 1000000,
    read_only: true,
    last_value: value,
    ...options
  });

const productionPower = (name, selector, value, options) =>
  feature({
    name,
    selector,
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
    min: 0,
    max: 6000,
    read_only: true,
    last_value: value,
    ...options
  });

export {
  uuid,
  minutesAgo,
  hoursAgo,
  daysAgo,
  feature,
  lightBinary,
  lightBrightness,
  lightColor,
  lightTemperature,
  switchBinary,
  switchPower,
  temperature,
  humidity,
  co2,
  battery,
  motion,
  presence,
  opening,
  leak,
  lightSensor,
  airQuality,
  shutterState,
  shutterPosition,
  thermostatTarget,
  acBinary,
  acMode,
  acTarget,
  energyPower,
  energyIndex,
  productionPower
};
