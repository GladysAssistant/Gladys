const { features } = require('../utils/features');

/**
 * GE managed models.
 */
const GE = {
  brand: 'GE',
  models: {
    '22670': [features.light, features.brightness],
    '45852GE': [features.light, features.brightness],
    '45853GE': [features.switch, features.power],
    '45856GE': [features.switch],
    '45857GE': [features.light, features.brightness],
  },
};

module.exports = {
  GE,
};
