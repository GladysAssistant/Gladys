const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { addSelector } = require('../../../../utils/addSelector');

const FEATURES = {
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    },
    [DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]: {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.VOLT,
    },
    [DEVICE_FEATURE_TYPES.SWITCH.ENERGY]: {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.AMPERE,
    },
    [DEVICE_FEATURE_TYPES.SWITCH.POWER]: {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.KILOWATT,
    },
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    },
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: {
      read_only: false,
      has_feedback: true,
      min: 1,
      max: 100,
    },
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: {
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 16777215,
    },
  },
};

const getFeature = (category, type, name, deviceExternalId, externalIdExtension = undefined) => {
  let externalId = `${deviceExternalId}:${category}:${type}`;
  if (externalIdExtension) {
    externalId += `:${externalIdExtension}`;
  }
  const feature = { ...FEATURES[category][type], type, category, name, external_id: externalId, selector: externalId };
  addSelector(feature);
  return feature;
};

module.exports = {
  getFeature,
};
