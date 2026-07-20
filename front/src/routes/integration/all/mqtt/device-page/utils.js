import get from 'get-value';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_FEATURE_UNITS_BY_CATEGORY
} from '../../../../../../../server/utils/constants';
import { slugify } from '../../../../../../../server/utils/slugify';

const SENSOR_CATEGORY_SUFFIX = '-sensor';

export const generateMqttExternalIdSuffix = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomChars = '';
  for (let i = 0; i < 4; i += 1) {
    randomChars += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomChars;
};

export const buildMqttExternalId = (name, suffix) => {
  const slug = slugify(name, false);
  if (!slug) {
    return 'mqtt:';
  }
  return `mqtt:${slug}-${suffix}`;
};

export const normalizeMqttExternalId = value => {
  if (!value.startsWith('mqtt:')) {
    if (value.length < 5) {
      return 'mqtt:';
    }
    return `mqtt:${value}`;
  }
  return value;
};

export const isSensorCategory = category => {
  if (
    category === DEVICE_FEATURE_CATEGORIES.BATTERY ||
    category === DEVICE_FEATURE_CATEGORIES.BATTERY_LOW ||
    category === DEVICE_FEATURE_CATEGORIES.CURRENCY ||
    category === DEVICE_FEATURE_CATEGORIES.TEXT ||
    category === DEVICE_FEATURE_CATEGORIES.HEPA_FILTER_MONITORING ||
    category === DEVICE_FEATURE_CATEGORIES.DATA ||
    category === DEVICE_FEATURE_CATEGORIES.DATARATE ||
    category === DEVICE_FEATURE_CATEGORIES.DURATION ||
    category === DEVICE_FEATURE_CATEGORIES.TAMPER ||
    category === DEVICE_FEATURE_CATEGORIES.INPUT
  ) {
    return true;
  }
  return category.endsWith(SENSOR_CATEGORY_SUFFIX) || category === DEVICE_FEATURE_CATEGORIES.SIGNAL;
};

export const normalizeForSearch = value =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const categoryTypeKey = (category, type) => `${category}|${type}`;

const MQTT_CATALOG_EXCLUDED_FEATURES = new Set([
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BURGLAR)
]);

export const isMqttCatalogFeatureVisible = (category, type) =>
  !MQTT_CATALOG_EXCLUDED_FEATURES.has(categoryTypeKey(category, type));

const CATEGORIES_WITHOUT_UNIT = new Set([
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR, 'integer'),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR, 'decimal'),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.FAN, DEVICE_FEATURE_TYPES.FAN.SPEED),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.UV_SENSOR, 'integer'),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.PH_SENSOR, 'decimal'),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.CUBE, DEVICE_FEATURE_TYPES.CUBE.MODE),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.BINARY),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.VTIC),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.NTARF),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.HHPHC),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN_1),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN_1),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.ADPS),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.ADIR1),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.ADIR2),
  categoryTypeKey(DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, DEVICE_FEATURE_TYPES.TELEINFORMATION.ADIR3)
]);

export const groupDevicesByRoom = (devices, houses) => {
  const roomMap = {};
  const unassigned = [];

  (houses || []).forEach(house => {
    (house.rooms || []).forEach(room => {
      roomMap[room.id] = { room, house };
    });
  });

  const groups = {};

  (devices || []).forEach(device => {
    if (device.room_id && roomMap[device.room_id]) {
      const { room, house } = roomMap[device.room_id];
      const groupKey = room.id;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          room,
          house,
          devices: []
        };
      }
      groups[groupKey].devices.push(device);
    } else {
      unassigned.push(device);
    }
  });

  const sortedGroups = Object.values(groups).sort((a, b) => {
    const houseCompare = a.house.name.localeCompare(b.house.name);
    if (houseCompare !== 0) {
      return houseCompare;
    }
    return a.room.name.localeCompare(b.room.name);
  });

  if (unassigned.length > 0) {
    sortedGroups.push({
      room: null,
      house: null,
      devices: unassigned
    });
  }

  return sortedGroups;
};

const flattenUnit = unit => (Array.isArray(unit) ? unit[0] : unit);

const FEATURE_UNIT_BY_CATEGORY_TYPE = {
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.CO2_SENSOR, 'integer')]: DEVICE_FEATURE_UNITS.PPM,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.CO2_SENSOR, 'decimal')]: DEVICE_FEATURE_UNITS.PPM,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR, 'integer')]: DEVICE_FEATURE_UNITS.LUX,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR, 'decimal')]: DEVICE_FEATURE_UNITS.LUX,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR, 'integer')]: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR, 'decimal')]: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
  [categoryTypeKey(
    DEVICE_FEATURE_CATEGORIES.LIGHT,
    DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS
  )]: DEVICE_FEATURE_UNITS.PERCENT,
  [categoryTypeKey(
    DEVICE_FEATURE_CATEGORIES.SHUTTER,
    DEVICE_FEATURE_TYPES.SHUTTER.POSITION
  )]: DEVICE_FEATURE_UNITS.PERCENT,
  [categoryTypeKey(
    DEVICE_FEATURE_CATEGORIES.CURTAIN,
    DEVICE_FEATURE_TYPES.CURTAIN.POSITION
  )]: DEVICE_FEATURE_UNITS.PERCENT,
  [categoryTypeKey(
    DEVICE_FEATURE_CATEGORIES.SWITCH,
    DEVICE_FEATURE_TYPES.SWITCH.ENERGY
  )]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [categoryTypeKey(
    DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR,
    'decimal'
  )]: DEVICE_FEATURE_UNITS.MILLIMETER_PER_HOUR,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR, 'integer')]: DEVICE_FEATURE_UNITS.MILLI_VOLT,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.LOCK, DEVICE_FEATURE_TYPES.LOCK.INTEGER)]: DEVICE_FEATURE_UNITS.PERCENT,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.POWER)]: DEVICE_FEATURE_UNITS.WATT,
  [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.CUBE, DEVICE_FEATURE_TYPES.CUBE.ROTATION)]: DEVICE_FEATURE_UNITS.DEGREE,
  [categoryTypeKey(
    DEVICE_FEATURE_CATEGORIES.HEPA_FILTER_MONITORING,
    DEVICE_FEATURE_TYPES.FILTER_MONITORING.FILTER_LIFE_REMAINING
  )]: DEVICE_FEATURE_UNITS.PERCENT
};

const ELECTRICAL_VEHICLE_BATTERY_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_ENERGY_REMAINING]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_LEVEL]: DEVICE_FEATURE_UNITS.PERCENT,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_POWER]: DEVICE_FEATURE_UNITS.KILOWATT,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_RANGE_ESTIMATE]: DEVICE_FEATURE_UNITS.KM,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_TEMPERATURE]: DEVICE_FEATURE_UNITS.CELSIUS,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_VOLTAGE]: DEVICE_FEATURE_UNITS.VOLT
};

const ELECTRICAL_VEHICLE_CHARGE_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_CURRENT]: DEVICE_FEATURE_UNITS.AMPERE,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_ENERGY_ADDED_TOTAL]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_ENERGY_CONSUMPTION_TOTAL]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_POWER]: DEVICE_FEATURE_UNITS.KILOWATT,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_VOLTAGE]: DEVICE_FEATURE_UNITS.VOLT,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.LAST_CHARGE_ENERGY_ADDED]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.LAST_CHARGE_ENERGY_CONSUMPTION]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.TARGET_CHARGE_LIMIT]: DEVICE_FEATURE_UNITS.PERCENT,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.TARGET_CURRENT]: DEVICE_FEATURE_UNITS.AMPERE
};

const ELECTRICAL_VEHICLE_CLIMATE_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.INDOOR_TEMPERATURE]: DEVICE_FEATURE_UNITS.CELSIUS,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.TARGET_TEMPERATURE]: DEVICE_FEATURE_UNITS.CELSIUS
};

const ELECTRICAL_VEHICLE_DRIVE_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_DRIVE.DRIVE_ENERGY_CONSUMPTION_TOTAL]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_DRIVE.SPEED]: DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR
};

const ELECTRICAL_VEHICLE_CONSUMPTION_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CONSUMPTION.ENERGY_CONSUMPTION]:
    DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_KM,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CONSUMPTION.ENERGY_EFFICIENCY]: DEVICE_FEATURE_UNITS.KM_PER_KILOWATT_HOUR
};

const ELECTRICAL_VEHICLE_STATE_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.ODOMETER]: DEVICE_FEATURE_UNITS.KM,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.TIRE_PRESSURE]: DEVICE_FEATURE_UNITS.BAR
};

const TELEINFORMATION_ENERGY_TYPES = new Set([
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EAIT,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD01,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD02,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD03,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD04,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ3,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ4
]);

const TELEINFORMATION_POWER_TYPES = new Set([
  DEVICE_FEATURE_TYPES.TELEINFORMATION.PREF,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.PCOUP,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTI,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN_1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2_1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3_1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS3
]);

const TELEINFORMATION_VOLTAGE_TYPES = new Set([
  DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS3
]);

const TELEINFORMATION_CURRENT_TYPES = new Set([
  DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS1,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS3,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX2,
  DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX3
]);

const getTeleinformationUnit = type => {
  if (TELEINFORMATION_ENERGY_TYPES.has(type)) {
    return DEVICE_FEATURE_UNITS.KILOWATT_HOUR;
  }
  if (TELEINFORMATION_POWER_TYPES.has(type)) {
    return DEVICE_FEATURE_UNITS.VOLT_AMPERE;
  }
  if (TELEINFORMATION_VOLTAGE_TYPES.has(type)) {
    return DEVICE_FEATURE_UNITS.VOLT;
  }
  if (TELEINFORMATION_CURRENT_TYPES.has(type)) {
    return DEVICE_FEATURE_UNITS.AMPERE;
  }
  return undefined;
};

const PREFERRED_DEFAULT_UNIT_BY_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.DATA]: DEVICE_FEATURE_UNITS.MEGABYTE,
  [DEVICE_FEATURE_CATEGORIES.DATARATE]: DEVICE_FEATURE_UNITS.MEGABITS_PER_SECOND,
  [DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR]: DEVICE_FEATURE_UNITS.M,
  [DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR]: DEVICE_FEATURE_UNITS.CM,
  [DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR]: DEVICE_FEATURE_UNITS.CELSIUS,
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: DEVICE_FEATURE_UNITS.WATT,
  [DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
  [DEVICE_FEATURE_CATEGORIES.VOLUME_SENSOR]: DEVICE_FEATURE_UNITS.LITER,
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR,
  [DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR]: DEVICE_FEATURE_UNITS.DECIBEL,
  [DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR]: DEVICE_FEATURE_UNITS.DEGREE,
  [DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR]: DEVICE_FEATURE_UNITS.MILLIMETER_PER_HOUR,
  [DEVICE_FEATURE_CATEGORIES.SURFACE]: DEVICE_FEATURE_UNITS.SQUARE_METER
};

const SWITCH_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.SWITCH.POWER]: DEVICE_FEATURE_UNITS.WATT,
  [DEVICE_FEATURE_TYPES.SWITCH.ENERGY]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]: DEVICE_FEATURE_UNITS.VOLT,
  [DEVICE_FEATURE_TYPES.SWITCH.CURRENT]: DEVICE_FEATURE_UNITS.AMPERE
};

const ENERGY_SENSOR_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER]: DEVICE_FEATURE_UNITS.WATT,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE]: DEVICE_FEATURE_UNITS.VOLT,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT]: DEVICE_FEATURE_UNITS.AMPERE,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX_TODAY]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX_YESTERDAY]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST]: DEVICE_FEATURE_UNITS.EURO,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST]: DEVICE_FEATURE_UNITS.EURO
};

const ENERGY_PRODUCTION_SENSOR_TYPE_UNITS = {
  [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.DAILY_PRODUCTION]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.DAILY_PRODUCTION_REVENUE]: DEVICE_FEATURE_UNITS.EURO,
  [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION]: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION_REVENUE]: DEVICE_FEATURE_UNITS.EURO
};

export const getDefaultUnitForFeature = (category, type) => {
  const key = categoryTypeKey(category, type);

  if (CATEGORIES_WITHOUT_UNIT.has(key)) {
    return undefined;
  }

  if (
    type === DEVICE_FEATURE_TYPES.SENSOR.BINARY ||
    type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ||
    type === DEVICE_FEATURE_TYPES.BUTTON.PUSH ||
    type === DEVICE_FEATURE_TYPES.TEXT.TEXT
  ) {
    return undefined;
  }

  if (FEATURE_UNIT_BY_CATEGORY_TYPE[key]) {
    return FEATURE_UNIT_BY_CATEGORY_TYPE[key];
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_BATTERY) {
    const unit = ELECTRICAL_VEHICLE_BATTERY_TYPE_UNITS[type];
    if (unit) {
      return unit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE) {
    const unit = ELECTRICAL_VEHICLE_CHARGE_TYPE_UNITS[type];
    if (unit) {
      return unit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CLIMATE) {
    const unit = ELECTRICAL_VEHICLE_CLIMATE_TYPE_UNITS[type];
    if (unit) {
      return unit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_DRIVE) {
    const unit = ELECTRICAL_VEHICLE_DRIVE_TYPE_UNITS[type];
    if (unit) {
      return unit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CONSUMPTION) {
    const unit = ELECTRICAL_VEHICLE_CONSUMPTION_TYPE_UNITS[type];
    if (unit) {
      return unit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE) {
    const unit = ELECTRICAL_VEHICLE_STATE_TYPE_UNITS[type];
    if (unit) {
      return unit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.SWITCH) {
    const switchUnit = SWITCH_TYPE_UNITS[type];
    if (switchUnit) {
      return switchUnit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    const energyUnit = ENERGY_SENSOR_TYPE_UNITS[type];
    if (energyUnit) {
      return energyUnit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR) {
    const productionUnit = ENERGY_PRODUCTION_SENSOR_TYPE_UNITS[type];
    if (productionUnit) {
      return productionUnit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TELEINFORMATION) {
    const teleinformationUnit = getTeleinformationUnit(type);
    if (teleinformationUnit) {
      return teleinformationUnit;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.GRID_SENSOR) {
    // Instantaneous powers (including the signed grid power) in watt,
    // cumulative meter indexes in kWh.
    if (typeof type === 'string' && (type.endsWith('-power') || type === 'power')) {
      return DEVICE_FEATURE_UNITS.WATT;
    }
    if (typeof type === 'string' && (type.endsWith('-index') || type === 'index')) {
      return DEVICE_FEATURE_UNITS.KILOWATT_HOUR;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT_SENSOR) {
    // Instantaneous powers in watt, cumulative meter indexes in kWh.
    if (typeof type === 'string' && (type.endsWith('-power') || type === 'power')) {
      return DEVICE_FEATURE_UNITS.WATT;
    }
    if (typeof type === 'string' && (type.endsWith('-index') || type === 'index')) {
      return DEVICE_FEATURE_UNITS.KILOWATT_HOUR;
    }
  }

  const preferredUnit = PREFERRED_DEFAULT_UNIT_BY_CATEGORY[category];
  if (preferredUnit) {
    return preferredUnit;
  }

  const units = DEVICE_FEATURE_UNITS_BY_CATEGORY[category];
  if (units && units.length > 0) {
    return flattenUnit(units[0]);
  }

  return undefined;
};

const applyDefaultUnit = (defaults, category, type) => {
  if (defaults.unit) {
    return defaults;
  }

  const unit = getDefaultUnitForFeature(category, type);
  if (!unit) {
    return defaults;
  }

  return { ...defaults, unit };
};

const TELEVISION_CONTINUOUS_CONTROL_TYPES = new Set([
  DEVICE_FEATURE_TYPES.TELEVISION.BINARY,
  DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
  DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL
]);

const MUSIC_CONTINUOUS_CONTROL_TYPES = new Set([
  DEVICE_FEATURE_TYPES.MUSIC.VOLUME,
  DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE
]);

export const isCatalogPushButtonFeature = (category, type) => {
  if (category === DEVICE_FEATURE_CATEGORIES.BUTTON && type === DEVICE_FEATURE_TYPES.BUTTON.PUSH) {
    return true;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TELEVISION) {
    return !TELEVISION_CONTINUOUS_CONTROL_TYPES.has(type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.MUSIC) {
    return !MUSIC_CONTINUOUS_CONTROL_TYPES.has(type);
  }

  return false;
};

export const getCatalogPreviewMode = (category, type) => {
  if (isCatalogPushButtonFeature(category, type)) {
    return 'push-button';
  }

  if (category === DEVICE_FEATURE_CATEGORIES.LOCK && type === DEVICE_FEATURE_TYPES.LOCK.INTEGER) {
    return 'lock-battery';
  }

  if (category === DEVICE_FEATURE_CATEGORIES.SIGNAL) {
    return 'signal-quality';
  }

  return 'device-row';
};

export const getFeatureDefaultValues = (category, type) => {
  const defaults = {
    read_only: isSensorCategory(category),
    keep_history: true,
    has_feedback: false
  };

  // Category-specific blocks first: some of their types ('power', 'index')
  // also exist in other categories matched below by type only.
  if (category === DEVICE_FEATURE_CATEGORIES.GRID_SENSOR) {
    if (type === DEVICE_FEATURE_TYPES.GRID_SENSOR.POWER) {
      // Signed grid exchange: import positive, export negative.
      return applyDefaultUnit({ ...defaults, min: -100000, max: 100000 }, category, type);
    }
    if (typeof type === 'string' && type.endsWith('-power')) {
      return applyDefaultUnit({ ...defaults, min: 0, max: 100000 }, category, type);
    }
    return applyDefaultUnit({ ...defaults, min: 0, max: 1000000 }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT_SENSOR) {
    if (typeof type === 'string' && (type.endsWith('-power') || type === 'power')) {
      return applyDefaultUnit({ ...defaults, min: 0, max: 100000 }, category, type);
    }
    return applyDefaultUnit({ ...defaults, min: 0, max: 1000000 }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.BINARY && category === DEVICE_FEATURE_CATEGORIES.LIGHT) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 1, read_only: false }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 1, read_only: isSensorCategory(category) }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.BUTTON.PUSH) {
    const readOnly = isSensorCategory(category);
    return applyDefaultUnit(
      {
        ...defaults,
        min: readOnly ? 0 : 1,
        max: 1,
        read_only: readOnly,
        keep_history: readOnly ? defaults.keep_history : false
      },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.MUSIC && type === DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 1, read_only: true }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.MUSIC && type === DEVICE_FEATURE_TYPES.MUSIC.VOLUME) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, read_only: false }, category, type);
  }

  if (isCatalogPushButtonFeature(category, type)) {
    return { ...defaults, min: 1, max: 1, read_only: false, keep_history: false };
  }

  if (category === DEVICE_FEATURE_CATEGORIES.SIGNAL) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, read_only: true }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.TEXT.TEXT) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 0, keep_history: false }, category, type);
  }

  if (
    type === DEVICE_FEATURE_TYPES.SWITCH.DIMMER ||
    type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS ||
    type === DEVICE_FEATURE_TYPES.FAN.PERCENT ||
    type === DEVICE_FEATURE_TYPES.FAN.SPEED ||
    type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION ||
    type === DEVICE_FEATURE_TYPES.CURTAIN.POSITION ||
    type === DEVICE_FEATURE_TYPES.TELEVISION.VOLUME
  ) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, read_only: false }, category, type);
  }

  if (
    type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE ||
    type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE ||
    type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.TARGET_TEMPERATURE
  ) {
    return applyDefaultUnit(
      {
        ...defaults,
        min: 5,
        max: 35,
        read_only: false,
        unit: DEVICE_FEATURE_UNITS.CELSIUS
      },
      category,
      type
    );
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE) {
    return applyDefaultUnit({ ...defaults, min: 153, max: 500, read_only: false }, category, type);
  }

  if (
    type === DEVICE_FEATURE_TYPES.LIGHT.COLOR ||
    type === DEVICE_FEATURE_TYPES.LIGHT.HUE ||
    type === DEVICE_FEATURE_TYPES.LIGHT.SATURATION
  ) {
    const max = type === DEVICE_FEATURE_TYPES.LIGHT.SATURATION ? 100 : 360;
    return applyDefaultUnit({ ...defaults, min: 0, max, read_only: false }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.POWER) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 500, read_only: true, unit: DEVICE_FEATURE_UNITS.WATT },
      category,
      type
    );
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.EFFECT_SPEED) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, read_only: false }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.EFFECT_MODE) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 20, read_only: false }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CUBE) {
    if (type === DEVICE_FEATURE_TYPES.CUBE.ROTATION) {
      return applyDefaultUnit(
        { ...defaults, min: -180, max: 180, read_only: true, unit: DEVICE_FEATURE_UNITS.DEGREE },
        category,
        type
      );
    }
    return applyDefaultUnit({ ...defaults, min: 0, max: 8, read_only: true }, category, type);
  }

  if (
    category === DEVICE_FEATURE_CATEGORIES.HEPA_FILTER_MONITORING &&
    type === DEVICE_FEATURE_TYPES.FILTER_MONITORING.FILTER_LIFE_REMAINING
  ) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 100, read_only: true, unit: DEVICE_FEATURE_UNITS.PERCENT },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.LOCK && type === DEVICE_FEATURE_TYPES.LOCK.INTEGER) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 100, read_only: true, unit: DEVICE_FEATURE_UNITS.PERCENT },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.BATTERY && type === DEVICE_FEATURE_TYPES.BATTERY.INTEGER) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, unit: DEVICE_FEATURE_UNITS.PERCENT }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR) {
    return { ...defaults, min: 0, max: 1000000, read_only: true };
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CO2_SENSOR) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 5000, read_only: true, unit: DEVICE_FEATURE_UNITS.PPM },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 100000, read_only: true, unit: DEVICE_FEATURE_UNITS.LUX },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR) {
    return applyDefaultUnit(
      { ...defaults, min: -40, max: 120, read_only: true, unit: DEVICE_FEATURE_UNITS.CELSIUS },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR) {
    return applyDefaultUnit({ ...defaults, min: -40, max: 80, unit: DEVICE_FEATURE_UNITS.CELSIUS }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, unit: DEVICE_FEATURE_UNITS.PERCENT }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100000 }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CURRENCY) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 1000000000, unit: DEVICE_FEATURE_UNITS.EURO }, category, type);
  }

  if (!isSensorCategory(category)) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, read_only: false }, category, type);
  }

  return applyDefaultUnit({ ...defaults, min: 0, max: 100 }, category, type);
};

export const getCatalogPreviewLabelKey = (category, type) => {
  const key = categoryTypeKey(category, type);
  const labeledPreviewKeys = {
    [categoryTypeKey(
      DEVICE_FEATURE_CATEGORIES.LOCK,
      DEVICE_FEATURE_TYPES.LOCK.STATE
    )]: 'deviceFeatureValue.category.lock.state.1',
    [categoryTypeKey(
      DEVICE_FEATURE_CATEGORIES.CUBE,
      DEVICE_FEATURE_TYPES.CUBE.MODE
    )]: 'integration.mqtt.featureCatalog.previewValues.cube.mode',
    [categoryTypeKey(
      DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR,
      'integer'
    )]: 'deviceFeatureValue.category.voc-matter-index-sensor.integer.medium',
    [categoryTypeKey(
      DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR,
      'integer'
    )]: 'deviceFeatureValue.category.no2-matter-index-sensor.integer.medium',
    [categoryTypeKey(DEVICE_FEATURE_CATEGORIES.RISK, 'integer')]: 'deviceFeatureValue.category.risk.integer.low-risk',
    [categoryTypeKey(
      DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE,
      DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.PLUGGED
    )]: 'deviceFeatureValue.category.electrical-vehicle-charge.plugged.1'
  };

  return labeledPreviewKeys[key] || null;
};

export const getFeaturePreviewValue = (category, type) => {
  // Category-specific blocks first: some of their types ('power', 'index')
  // also exist in other categories matched below by type only.
  if (category === DEVICE_FEATURE_CATEGORIES.GRID_SENSOR) {
    if (type === DEVICE_FEATURE_TYPES.GRID_SENSOR.INPUT_POWER) {
      return 752;
    }
    if (type === DEVICE_FEATURE_TYPES.GRID_SENSOR.OUTPUT_POWER) {
      return 0;
    }
    if (type === DEVICE_FEATURE_TYPES.GRID_SENSOR.POWER) {
      return -850;
    }
    if (type === DEVICE_FEATURE_TYPES.GRID_SENSOR.INPUT_INDEX) {
      return 1072.8;
    }
    return 42.5;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT_SENSOR) {
    if (type === DEVICE_FEATURE_TYPES.HOME_OUTPUT_SENSOR.POWER) {
      return 311;
    }
    if (type === DEVICE_FEATURE_TYPES.HOME_OUTPUT_SENSOR.INDEX) {
      return 764.6;
    }
    if (type === DEVICE_FEATURE_TYPES.HOME_OUTPUT_SENSOR.OFF_GRID_POWER) {
      return 0;
    }
    return 12.3;
  }

  if (
    type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE ||
    type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE ||
    type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.TARGET_TEMPERATURE
  ) {
    return 20;
  }

  if (type === DEVICE_FEATURE_TYPES.SWITCH.BINARY || type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
    return 1;
  }

  if (
    type === DEVICE_FEATURE_TYPES.SWITCH.DIMMER ||
    type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS ||
    type === DEVICE_FEATURE_TYPES.FAN.PERCENT ||
    type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION
  ) {
    return 65;
  }

  if (type === DEVICE_FEATURE_TYPES.CURTAIN.POSITION) {
    return 75;
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.EFFECT_SPEED) {
    return 65;
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.EFFECT_MODE) {
    return 3;
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.POWER) {
    return 15;
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE) {
    return 300;
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.HUE) {
    return 180;
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.SATURATION) {
    return 75;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CUBE) {
    if (type === DEVICE_FEATURE_TYPES.CUBE.ROTATION) {
      return 90;
    }
    if (type === DEVICE_FEATURE_TYPES.CUBE.MODE) {
      return 5;
    }
  }

  if (category === DEVICE_FEATURE_CATEGORIES.LOCK) {
    if (type === DEVICE_FEATURE_TYPES.LOCK.INTEGER) {
      return 78;
    }
    if (type === DEVICE_FEATURE_TYPES.LOCK.STATE) {
      return 1;
    }
  }

  if (
    category === DEVICE_FEATURE_CATEGORIES.HEPA_FILTER_MONITORING &&
    type === DEVICE_FEATURE_TYPES.FILTER_MONITORING.FILTER_LIFE_REMAINING
  ) {
    return 72;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR) {
    return 65;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR) {
    return 42;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CO2_SENSOR) {
    return 850;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR) {
    return 21.5;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR) {
    return 48;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.BATTERY) {
    return 85;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR) {
    return 1;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.SIGNAL) {
    return 85;
  }

  if (isCatalogPushButtonFeature(category, type)) {
    return null;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CURRENCY) {
    return 1250.75;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.DATA) {
    return 512;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.DATARATE) {
    return 25.6;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR) {
    return 1.25;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_BATTERY) {
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_RANGE_ESTIMATE) {
      return 670;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_LEVEL) {
      return 82;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_POWER) {
      return 45;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_VOLTAGE) {
      return 400;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_TEMPERATURE) {
      return 22;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_ENERGY_REMAINING) {
      return 58;
    }
    return 42;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE) {
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.PLUGGED) {
      return 1;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_CURRENT) {
      return 16;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_VOLTAGE) {
      return 230;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_POWER) {
      return 11;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.TARGET_CHARGE_LIMIT) {
      return 80;
    }
    if (
      type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_ENERGY_ADDED_TOTAL ||
      type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.LAST_CHARGE_ENERGY_ADDED
    ) {
      return 28.5;
    }
    if (
      type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_ENERGY_CONSUMPTION_TOTAL ||
      type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.LAST_CHARGE_ENERGY_CONSUMPTION
    ) {
      return 30.2;
    }
    return 42;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CLIMATE) {
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.INDOOR_TEMPERATURE) {
      return 21;
    }
    return 20;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_DRIVE) {
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_DRIVE.SPEED) {
      return 110;
    }
    return 1250;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CONSUMPTION) {
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CONSUMPTION.ENERGY_EFFICIENCY) {
      return 6.2;
    }
    return 18.5;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE) {
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.ODOMETER) {
      return 48200;
    }
    if (type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.TIRE_PRESSURE) {
      return 2.4;
    }
    return 1;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    if (type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE) {
      return 230;
    }
    if (type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT) {
      return 1.2;
    }
    if (
      type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY ||
      type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX ||
      type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION ||
      type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION
    ) {
      return 12.4;
    }
    if (
      type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST ||
      type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST
    ) {
      return 3.85;
    }
    return 245;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR) {
    if (
      type === DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.DAILY_PRODUCTION_REVENUE ||
      type === DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION_REVENUE
    ) {
      return 4.2;
    }
    return 8.6;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR) {
    return 320;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR) {
    return 1013;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR) {
    if (type === 'integer') {
      return 2.5;
    }
    return 1.8;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.UV_SENSOR) {
    return 6;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.VOC_INDEX_SENSOR) {
    return 150;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR) {
    return 2;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR) {
    return 2;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.RISK) {
    return 1;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR) {
    return 42;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.VOLUME_SENSOR) {
    return 45;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR) {
    return 52;
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TELEINFORMATION) {
    if (TELEINFORMATION_CURRENT_TYPES.has(type)) {
      return 12.5;
    }
    if (TELEINFORMATION_VOLTAGE_TYPES.has(type)) {
      return 230;
    }
    if (TELEINFORMATION_POWER_TYPES.has(type)) {
      return 3500;
    }
    if (TELEINFORMATION_ENERGY_TYPES.has(type)) {
      return 45230.5;
    }
    if (type === DEVICE_FEATURE_TYPES.TELEINFORMATION.BINARY) {
      return 1;
    }
    return 12;
  }

  if (type === DEVICE_FEATURE_TYPES.TEXT.TEXT) {
    return null;
  }

  if (!isSensorCategory(category)) {
    return 1;
  }

  return 42;
};

export const getFeaturePreviewStringValue = (category, type) => {
  if (type === DEVICE_FEATURE_TYPES.TEXT.TEXT) {
    return 'Hello Gladys';
  }
  return null;
};

export const filterFeatureCatalogOptions = (options, search, dictionary) => {
  if (!search || !search.trim()) {
    return options;
  }

  const normalizedSearch = normalizeForSearch(search.trim());

  return options
    .map(group => {
      const filteredOptions = group.options.filter(option => {
        const label = normalizeForSearch(option.label);
        const categoryLabel = normalizeForSearch(group.label);
        const description = normalizeForSearch(
          get(dictionary, `integration.mqtt.featureCatalog.descriptions.${option.category}.${option.type}`, '')
        );
        const keywords = normalizeForSearch(
          get(dictionary, `integration.mqtt.featureCatalog.keywords.${option.category}.${option.type}`, '')
        );

        return (
          label.includes(normalizedSearch) ||
          categoryLabel.includes(normalizedSearch) ||
          description.includes(normalizedSearch) ||
          keywords.includes(normalizedSearch)
        );
      });

      if (filteredOptions.length === 0) {
        return null;
      }

      return { ...group, options: filteredOptions };
    })
    .filter(Boolean);
};

export const featureNeedsMinMax = (category, type) => {
  if (category === DEVICE_FEATURE_CATEGORIES.TEXT) {
    return false;
  }
  if (type === DEVICE_FEATURE_TYPES.BUTTON.PUSH) {
    return false;
  }
  return true;
};

const DEVICE_LEVEL_FIELDS = new Set(['name', 'external_id', 'room_id', 'service_id', 'should_poll', 'poll_frequency']);

const valuesMatch = (left, right) => {
  if (left === right) {
    return true;
  }
  if ((left === '' || left == null) && (right === '' || right == null)) {
    return true;
  }
  if (left != null && right != null) {
    return String(left) === String(right);
  }
  return false;
};

const findFeatureIndexMatchingAllErrors = (features, errors) => {
  return features.findIndex(feature => errors.every(error => valuesMatch(feature[error.attribute], error.value)));
};

const deviceMatchesAllErrors = (device, errors) => {
  return errors.every(
    error => DEVICE_LEVEL_FIELDS.has(error.attribute) && valuesMatch(device[error.attribute], error.value)
  );
};

const assignFeatureError = (featureFields, featureIndex, field, property) => {
  if (!featureFields[featureIndex]) {
    featureFields[featureIndex] = {};
  }
  featureFields[featureIndex][field] = property;
};

const normalizeValidationProperty = property => {
  if (property.attribute === 'selector') {
    return {
      ...property,
      attribute: 'name'
    };
  }
  return property;
};

export const parseMqttDeviceValidationErrors = (properties, device) => {
  const deviceFields = {};
  const featureFields = {};
  const errorItems = [];

  const features = (device && device.features) || [];
  const errors = (properties || []).filter(property => property && property.attribute).map(normalizeValidationProperty);

  if (errors.length === 0) {
    return { deviceFields, featureFields, errorItems, expandedFeatureIndices: [] };
  }

  const matchingFeatureIndex = findFeatureIndexMatchingAllErrors(features, errors);
  if (matchingFeatureIndex !== -1) {
    errors.forEach(error => {
      const { attribute: field } = error;
      assignFeatureError(featureFields, matchingFeatureIndex, field, error);
      errorItems.push({
        scope: 'feature',
        featureIndex: matchingFeatureIndex,
        field,
        property: error,
        feature: features[matchingFeatureIndex]
      });
    });
  } else if (device && deviceMatchesAllErrors(device, errors)) {
    errors.forEach(error => {
      const { attribute: field } = error;
      deviceFields[field] = error;
      errorItems.push({ scope: 'device', field, property: error });
    });
  } else {
    errors.forEach(error => {
      const { attribute: field, value } = error;
      let assigned = false;

      if (DEVICE_LEVEL_FIELDS.has(field) && valuesMatch(device[field], value)) {
        deviceFields[field] = error;
        errorItems.push({ scope: 'device', field, property: error });
        assigned = true;
      }

      if (!assigned) {
        const matchingIndices = features
          .map((feature, index) => (valuesMatch(feature[field], value) ? index : -1))
          .filter(index => index !== -1);

        if (matchingIndices.length > 0) {
          matchingIndices.forEach(index => {
            assignFeatureError(featureFields, index, field, error);
            errorItems.push({
              scope: 'feature',
              featureIndex: index,
              field,
              property: error,
              feature: features[index]
            });
          });
          assigned = true;
        }
      }

      if (!assigned && DEVICE_LEVEL_FIELDS.has(field) && (device[field] == null || device[field] === '')) {
        deviceFields[field] = error;
        errorItems.push({ scope: 'device', field, property: error });
        assigned = true;
      }

      if (!assigned) {
        features.forEach((feature, index) => {
          const featureValue = feature[field];
          const isEmpty = featureValue == null || featureValue === '';
          const isInvalidNumber =
            (field === 'min' || field === 'max') && (featureValue === '' || Number.isNaN(Number(featureValue)));

          if (isEmpty || isInvalidNumber) {
            assignFeatureError(featureFields, index, field, error);
            errorItems.push({
              scope: 'feature',
              featureIndex: index,
              field,
              property: error,
              feature
            });
          }
        });
      }
    });
  }

  const expandedFeatureIndices = [
    ...new Set(errorItems.filter(item => item.scope === 'feature').map(item => item.featureIndex))
  ];

  const seenErrorKeys = new Set();
  const dedupedErrorItems = errorItems.filter(item => {
    const key = `${item.scope}-${
      item.featureIndex !== undefined && item.featureIndex !== null ? item.featureIndex : 'device'
    }-${item.field}`;
    if (seenErrorKeys.has(key)) {
      return false;
    }
    seenErrorKeys.add(key);
    return true;
  });

  return { deviceFields, featureFields, errorItems: dedupedErrorItems, expandedFeatureIndices };
};

export const isDeviceFieldErrored = (validationErrors, field) => {
  return Boolean(validationErrors && validationErrors.deviceFields && validationErrors.deviceFields[field]);
};

export const isFeatureFieldErrored = (validationErrors, featureIndex, field) => {
  return Boolean(
    validationErrors &&
      validationErrors.featureFields &&
      validationErrors.featureFields[featureIndex] &&
      validationErrors.featureFields[featureIndex][field]
  );
};

export const clearMqttDeviceValidationError = (validationErrors, field, featureIndex) => {
  if (!validationErrors) {
    return null;
  }

  const nextValidationErrors = {
    deviceFields: { ...validationErrors.deviceFields },
    featureFields: { ...validationErrors.featureFields },
    errorItems: [...validationErrors.errorItems],
    expandedFeatureIndices: [...validationErrors.expandedFeatureIndices]
  };

  if (featureIndex === undefined) {
    delete nextValidationErrors.deviceFields[field];
  } else if (nextValidationErrors.featureFields[featureIndex]) {
    const featureFieldErrors = { ...nextValidationErrors.featureFields[featureIndex] };
    delete featureFieldErrors[field];
    if (Object.keys(featureFieldErrors).length === 0) {
      delete nextValidationErrors.featureFields[featureIndex];
    } else {
      nextValidationErrors.featureFields[featureIndex] = featureFieldErrors;
    }
  }

  nextValidationErrors.errorItems = nextValidationErrors.errorItems.filter(item => {
    if (item.field !== field) {
      return true;
    }
    if (featureIndex === undefined) {
      return item.scope !== 'device';
    }
    return item.scope !== 'feature' || item.featureIndex !== featureIndex;
  });

  if (
    Object.keys(nextValidationErrors.deviceFields).length === 0 &&
    Object.keys(nextValidationErrors.featureFields).length === 0
  ) {
    return null;
  }

  return nextValidationErrors;
};
