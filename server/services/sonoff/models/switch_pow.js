const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');

const getModel = () => {
  return 'sonoff-pow';
};

const getFeatures = () => {
  return [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.VOLT,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.AMPERE,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.KILOWATT,
    },
  ];
};

module.exports = {
  getFeatures,
  getModel,
};
