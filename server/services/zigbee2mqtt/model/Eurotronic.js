const { features } = require('../utils/features');

/**
 * Eurotronic managed models.
 */
const Eurotronic = {
  brand: 'Eurotronic',
  models: {
    SPZB0001: [features.temperature], // features.heating],
  },
};

module.exports = {
  Eurotronic,
};
