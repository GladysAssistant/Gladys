const { features } = require('../utils/features');

/**
 * Salus Controls managed models.
 */
const SalusControls = {
  brand: 'Salus Controls',
  models: {
    OS600: [features.door],
    // RE600: [],
    SP600: [features.energy, features.power, features.switch_sensor],
    SPE600: [features.energy, features.power, features.switch_sensor],
    SR600: [features.switch_sensor],
    SW600: [features.door],
    WLS600: [features.water],
  },
};

module.exports = {
  SalusControls,
};
