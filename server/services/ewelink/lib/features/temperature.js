const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: (name) => {
    return {
      name: `${name} Temperature`,
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      read_only: true,
      has_feedback: false,
      min: -100,
      max: 200,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };
  },
  readStates: (externalId, params) => {
    const states = [];

    // Current temperature
    if (params.currentTemperature) {
      states.push({
        featureExternalId: `${externalId}:temperature`,
        state: params.currentTemperature,
      });
    }

    return states;
  },
};
