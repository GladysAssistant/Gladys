const { features } = require('../utils/features');

/**
 * NET2GRID managed models.
 */
const NET2GRID = {
  brand: 'NET2GRID',
  models: {
    'N2G-SP': [features.energy, features.power, features.switch],
  },
};

module.exports = {
  NET2GRID,
};
