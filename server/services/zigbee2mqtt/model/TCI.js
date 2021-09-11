const { features } = require('../utils/features');

/**
 * TCI managed models.
 */
const TCI = {
  brand: 'TCI',
  models: {
    '151570': [features.brightness, features.light],
    '676-00301024955Z': [features.brightness, features.light],
  },
};

module.exports = {
  TCI,
};
