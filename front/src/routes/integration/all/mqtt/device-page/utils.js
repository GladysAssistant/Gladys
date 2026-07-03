import get from 'get-value';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../../server/utils/constants';

const SENSOR_CATEGORY_SUFFIX = '-sensor';

export const isSensorCategory = category => {
  if (category === DEVICE_FEATURE_CATEGORIES.BATTERY || category === DEVICE_FEATURE_CATEGORIES.BATTERY_LOW) {
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

export const getFeatureDefaultValues = (category, type) => {
  const defaults = {
    read_only: isSensorCategory(category),
    keep_history: true,
    has_feedback: false
  };

  if (type === DEVICE_FEATURE_TYPES.SWITCH.BINARY || type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
    return { ...defaults, min: 0, max: 1, read_only: false };
  }

  if (type === DEVICE_FEATURE_TYPES.BUTTON.PUSH) {
    return { ...defaults, min: 1, max: 1, read_only: false, keep_history: false };
  }

  if (type === DEVICE_FEATURE_TYPES.TEXT.TEXT) {
    return { ...defaults, min: 0, max: 0, keep_history: false };
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
    return { ...defaults, min: 0, max: 100, read_only: false };
  }

  if (
    type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE ||
    type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE ||
    type === DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.TARGET_TEMPERATURE
  ) {
    return {
      ...defaults,
      min: 5,
      max: 35,
      read_only: false,
      unit: DEVICE_FEATURE_UNITS.CELSIUS
    };
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE) {
    return { ...defaults, min: 153, max: 500, read_only: false };
  }

  if (type === DEVICE_FEATURE_TYPES.LIGHT.COLOR || type === DEVICE_FEATURE_TYPES.LIGHT.HUE) {
    return { ...defaults, min: 0, max: 360, read_only: false };
  }

  if (type === DEVICE_FEATURE_TYPES.BATTERY.INTEGER) {
    return { ...defaults, min: 0, max: 100, unit: DEVICE_FEATURE_UNITS.PERCENT };
  }

  if (category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR) {
    return { ...defaults, min: -40, max: 80, unit: DEVICE_FEATURE_UNITS.CELSIUS };
  }

  if (category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR) {
    return { ...defaults, min: 0, max: 100, unit: DEVICE_FEATURE_UNITS.PERCENT };
  }

  if (category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    return { ...defaults, min: 0, max: 100000 };
  }

  if (!isSensorCategory(category)) {
    return { ...defaults, min: 0, max: 100, read_only: false };
  }

  return { ...defaults, min: 0, max: 100 };
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
