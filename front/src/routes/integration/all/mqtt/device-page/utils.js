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
    category === DEVICE_FEATURE_CATEGORIES.TEXT
  ) {
    return true;
  }
  return category.endsWith(SENSOR_CATEGORY_SUFFIX) || category === DEVICE_FEATURE_CATEGORIES.SIGNAL;
};

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
  if (
    type === DEVICE_FEATURE_TYPES.SENSOR.BINARY ||
    type === DEVICE_FEATURE_TYPES.SWITCH.BINARY ||
    type === DEVICE_FEATURE_TYPES.BUTTON.PUSH ||
    type === DEVICE_FEATURE_TYPES.TEXT.TEXT
  ) {
    return undefined;
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

export const getFeatureDefaultValues = (category, type) => {
  const defaults = {
    read_only: isSensorCategory(category),
    keep_history: true,
    has_feedback: false
  };

  if (type === DEVICE_FEATURE_TYPES.SWITCH.BINARY || type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 1, read_only: false }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.BUTTON.PUSH) {
    return applyDefaultUnit(
      { ...defaults, min: 1, max: 1, read_only: false, keep_history: false },
      category,
      type
    );
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

  if (type === DEVICE_FEATURE_TYPES.LIGHT.COLOR || type === DEVICE_FEATURE_TYPES.LIGHT.HUE) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 360, read_only: false }, category, type);
  }

  if (type === DEVICE_FEATURE_TYPES.BATTERY.INTEGER) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, unit: DEVICE_FEATURE_UNITS.PERCENT }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR) {
    return applyDefaultUnit(
      { ...defaults, min: -40, max: 80, unit: DEVICE_FEATURE_UNITS.CELSIUS },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 100, unit: DEVICE_FEATURE_UNITS.PERCENT },
      category,
      type
    );
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100000 }, category, type);
  }

  if (category === DEVICE_FEATURE_CATEGORIES.CURRENCY) {
    return applyDefaultUnit(
      { ...defaults, min: 0, max: 1000000000, unit: DEVICE_FEATURE_UNITS.EURO },
      category,
      type
    );
  }

  if (!isSensorCategory(category)) {
    return applyDefaultUnit({ ...defaults, min: 0, max: 100, read_only: false }, category, type);
  }

  return applyDefaultUnit({ ...defaults, min: 0, max: 100 }, category, type);
};

export const getFeaturePreviewValue = (category, type) => {
  if (type === DEVICE_FEATURE_TYPES.SWITCH.BINARY || type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
    return 1;
  }
  if (
    type === DEVICE_FEATURE_TYPES.SWITCH.DIMMER ||
    type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS ||
    type === DEVICE_FEATURE_TYPES.FAN.PERCENT
  ) {
    return 65;
  }
  if (type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE) {
    return 300;
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
  if (category === DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR) {
    return 38.5;
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
  if (category === DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR) {
    return 42;
  }
  if (category === DEVICE_FEATURE_CATEGORIES.VOLUME_SENSOR) {
    return 45;
  }
  if (category === DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR) {
    return 52;
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

  const normalizedSearch = search.trim().toLowerCase();

  return options
    .map(group => {
      const filteredOptions = group.options.filter(option => {
        const label = option.label.toLowerCase();
        const categoryLabel = group.label.toLowerCase();
        const description = get(
          dictionary,
          `integration.mqtt.featureCatalog.descriptions.${option.category}.${option.type}`,
          ''
        ).toLowerCase();
        const keywords = get(
          dictionary,
          `integration.mqtt.featureCatalog.keywords.${option.category}.${option.type}`,
          ''
        ).toLowerCase();

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
