const { features } = require('../utils/features');

/**
 * AduroSmart managed models.
 */
const AduroSmart = {
  brand: 'AduroSmart',
  models: {
    '81809/81813': [features.brightness, features.color, features.color_temperature, features.light],
    '81825': [features.button],
    '81849': [features.brightness, features.light],
    '81855': [features.brightness, features.light],
    BPU3: [features.switch_sensor],
  },
};

module.exports = {
  AduroSmart,
};
