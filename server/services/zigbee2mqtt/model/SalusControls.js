const { features } = require('../utils/features');

/**
 * Salus Controls managed models.
 */
const SalusControls = {
  brand: 'Salus Controls',
  models: {
    OS600: [features.door],
    // RE600: [],
    SP600: [features.energy, features.power, features.switch],
    SPE600: [features.energy, features.power, features.switch],
    SR600: [features.switch],
    SW600: [features.door],
    WLS600: [features.water],
  },
};

module.exports = {
  SalusControls,
};
