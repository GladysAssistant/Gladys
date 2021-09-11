const { features } = require('../utils/features');

/**
 * FrankEver managed models.
 */
const FrankEver = {
  brand: 'FrankEver',
  models: {
    FK_V02: [features.switch_sensor],
  },
};

module.exports = {
  FrankEver,
};
