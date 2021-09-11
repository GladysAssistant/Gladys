const { features } = require('../utils/features');

/**
 * LightSolutions managed models.
 */
const LightSolutions = {
  brand: 'LightSolutions',
  models: {
    '200106V3': [features.switch_sensor],
    '200403V2-B': [features.brightness, features.light],
  },
};

module.exports = {
  LightSolutions,
};
