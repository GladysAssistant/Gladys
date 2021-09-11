const { features } = require('../utils/features');

/**
 * GE managed models.
 */
const GE = {
  brand: 'GE',
  models: {
    '22670': [features.brightness, features.light],
    '45852GE': [features.brightness, features.light],
    '45853GE': [features.energy, features.power, features.switch],
    '45856GE': [features.switch],
    '45857GE': [features.brightness, features.light],
    'POTLK-WH02': [features.switch],
    'PQC19-DY01': [features.brightness, features.light],
    'PSB19-SW27': [features.brightness, features.light],
    'PTAPT-WH02': [features.switch],
  },
};

module.exports = {
  GE,
};
