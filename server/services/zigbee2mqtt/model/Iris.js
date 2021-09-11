const { features } = require('../utils/features');

/**
 * Iris managed models.
 */
const Iris = {
  brand: 'Iris',
  models: {
    '27087-03': [features.switch],
    '3210-L': [features.current, features.power, features.switch, features.voltage],
    '3320-L': [features.door, features.temperature],
    '3326-L': [features.motion, features.temperature],
    '3450-L': [features.button],
    '3460-L': [features.button, features.temperature],
    IL06_1: [features.door, features.temperature],
    iL07_1: [features.humidity, features.motion, features.temperature],
  },
};

module.exports = {
  Iris,
};
