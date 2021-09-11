const { features } = require('../utils/features');

/**
 * Lupus managed models.
 */
const Lupus = {
  brand: 'Lupus',
  models: {
    '12031': [features.door],
    '12050': [features.power, features.switch],
    '12126': [features.switch],
    '12127': [features.switch],
    LS12128: [features.door],
  },
};

module.exports = {
  Lupus,
};
