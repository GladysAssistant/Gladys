const { features } = require('../utils/features');

/**
 * Commercial Electric managed models.
 */
const CommercialElectric = {
  brand: 'Commercial Electric',
  models: {
    '53170161': [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  CommercialElectric,
};
