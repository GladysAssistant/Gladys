const { features } = require('../utils/features');

/**
 * Titan Products managed models.
 */
const TitanProducts = {
  brand: 'Titan Products',
  models: {
    'TPZRCO2HT-Z3': [features.co2, features.humidity, features.temperature],
  },
};

module.exports = {
  TitanProducts,
};
