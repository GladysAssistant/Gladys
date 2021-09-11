const { features } = require('../utils/features');

/**
 * Hampton Bay managed models.
 */
const HamptonBay = {
  brand: 'Hampton Bay',
  models: {
    '54668161': [features.brightness, features.color_temperature, features.light],
    '99432': [features.brightness, features.light],
  },
};

module.exports = {
  HamptonBay,
};
