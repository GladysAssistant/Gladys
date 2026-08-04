import get from 'get-value';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  LEVEL_MATTER_STATE,
  getFanFeatureOptions
} from '../../../server/utils/constants';

const NUMERIC_VALUE = /^-?\d+$/;

// Those fan features are bitmaps, the device tells us which values it supports with min/max
const FAN_LABELED_FEATURE_TYPES = [
  DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
  DEVICE_FEATURE_TYPES.FAN.WIND_SETTING,
  DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION
];

// Matter index sensors all share the same level scale
const MATTER_INDEX_SENSOR_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR,
  DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR
];

const getValueLabel = (dictionary, path, value) => get(dictionary, `${path}.${value}`, { default: `${value}` });

/**
 * @description Get the list of values a device feature can take, with their translated label.
 * @param {Object} dictionary - The i18n dictionary.
 * @param {Object} deviceFeature - The device feature.
 * @returns {Array} The list of { label, value } options, or null if the feature is not a constant.
 * @example
 * const options = getDeviceFeatureValueOptions(dictionary, { category: 'opening-sensor', type: 'binary' });
 */
function getDeviceFeatureValueOptions(dictionary, deviceFeature) {
  if (!deviceFeature) {
    return null;
  }

  const { category, type, min, max } = deviceFeature;

  if (category === DEVICE_FEATURE_CATEGORIES.FAN && FAN_LABELED_FEATURE_TYPES.includes(type)) {
    return getFanFeatureOptions(type, min, max).map(value => ({
      value,
      label: getValueLabel(dictionary, `deviceFeatureValue.category.${category}.${type}`, value)
    }));
  }

  if (MATTER_INDEX_SENSOR_CATEGORIES.includes(category)) {
    return Object.values(LEVEL_MATTER_STATE).map(value => ({
      value,
      label: getValueLabel(dictionary, 'deviceFeatureValue.category.level-matter-index-sensor.level-state', value)
    }));
  }

  // Binary features have their own labels per category (ex: Opened/Closed for an opening sensor),
  // with a generic Active/Inactive fallback
  if (type === DEVICE_FEATURE_TYPES.SENSOR.BINARY) {
    const labels =
      get(dictionary, `deviceFeatureValue.category.${category}.binary`) ||
      get(dictionary, 'deviceFeatureValue.type.binary');
    if (!labels) {
      return null;
    }
    return [
      { value: 1, label: labels.one },
      { value: 0, label: labels.zero }
    ];
  }

  // For all other features, the translations are the source of truth: a feature holding
  // constants (button click, shutter state, pilot wire mode...) has one label per value.
  const valueLabels = get(dictionary, `deviceFeatureValue.category.${category}.${type}`);
  if (!valueLabels) {
    return null;
  }

  const options = Object.keys(valueLabels)
    .filter(key => NUMERIC_VALUE.test(key))
    .map(key => ({ value: Number(key), label: valueLabels[key] }))
    .sort((optionA, optionB) => optionA.value - optionB.value);

  return options.length > 0 ? options : null;
}

export default getDeviceFeatureValueOptions;
