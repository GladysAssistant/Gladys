const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const FEATURES = {
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
      name: 'Switch',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: true,
    },
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
      name: 'Switch',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: true,
    },
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: {
      name: 'Brightness',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      min: 0,
      max: 100,
      read_only: false,
      has_feedback: true,
    },
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: {
      name: 'Color temperature',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      min: 0,
      max: 100,
      read_only: false,
      has_feedback: true,
    },
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: {
      name: 'Color',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      min: 0,
      max: 16777215,
      read_only: false,
      has_feedback: true,
    },
  },
};

const generateFeature = (defaultFeature, deviceExternalId) => {
  return { ...defaultFeature, external_id: `${deviceExternalId}:${defaultFeature.type}` };
};

module.exports = {
  FEATURES,
  generateFeature,
};
