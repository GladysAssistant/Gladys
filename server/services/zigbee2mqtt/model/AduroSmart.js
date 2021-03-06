const { features } = require('../utils/features');

/**
 * AduroSmart managed models.
 */
const AduroSmart = {
  brand: 'AduroSmart',
  models: {
    '81809': [features.light, features.brightness, features.color_temperature, features.color],
    '81825': [features.switch_sensor],
  },
};

module.exports = {
  AduroSmart,
};
