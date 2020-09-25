const { features } = require('../utils/features');

/**
 * GE managed models.
 */
const GE = {
  brand: 'GE',
  models: {
    '22670': [features.switch, features.brightness],
    '45852GE': [features.switch, features.brightness],
    '45853GE': [features.switch, features.power],
    '45856GE': [features.switch],
    '45857GE': [features.switch, features.brightness],
  },
};

module.exports = {
  GE,
};
