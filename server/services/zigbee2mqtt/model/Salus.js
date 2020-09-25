const { features } = require('../utils/features');

/**
 * Salus managed models.
 */
const Salus = {
  brand: 'Salus',
  models: {
    SP600: [features.switch, features.power],
  },
};

module.exports = {
  Salus,
};
