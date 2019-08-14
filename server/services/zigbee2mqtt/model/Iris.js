const { features } = require('../utils/features');

/**
 * Iris managed models.
 */
const Iris = {
  brand: 'Iris',
  models: {
    '3210-L': [features.switch],
    '3326-L': [features.temperature, features.presence],
    '3320-L': [features.door],
  },
};

module.exports = {
  Iris,
};
