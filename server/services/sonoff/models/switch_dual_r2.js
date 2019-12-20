const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getModel = () => {
  return 'sonoff-dual-r2';
};

const getLabel = () => {
  return 'Sonoff Dual R2';
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
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    },
  ];
};

const fillFeatures = (device) => {
  for (let i = 0; i < 2; i += 1) {
    const feature = device.features[i];
    feature.name = `${device.name} - switch ${i + 1}`;
    feature.external_id = `${device.external_id}:${feature.category}:${feature.type}:${i + 1}`;
    feature.selector = feature.external_id;
  }
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
  fillFeatures,
};
