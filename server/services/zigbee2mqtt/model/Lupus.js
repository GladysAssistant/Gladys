const { features } = require('../utils/features');

/**
 * Lupus managed models.
 */
const Lupus = {
  brand: 'Lupus',
  models: {
    '12031': [features.door],
    '12050': [features.power, features.switch_sensor],
    '12126': [features.switch_sensor],
    '12127': [features.switch_sensor],
    LS12128: [features.door],
  },
};

module.exports = {
  Lupus,
};
