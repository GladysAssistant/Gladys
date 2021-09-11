const { features } = require('../utils/features');

/**
 * Elko managed models.
 */
const Elko = {
  brand: 'Elko',
  models: {
    '316GLEDRF': [features.brightness, features.light],
    '4523430': [features.temperature],
    EKO07090: [features.brightness, features.light],
    EKO07144: [features.switch],
  },
};

module.exports = {
  Elko,
};
