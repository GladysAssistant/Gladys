const { features } = require('../utils/features');

/**
 * SHOJZJ managed models.
 */
const SHOJZJ = {
  brand: 'SHOJZJ',
  models: {
    '378RT': [features.door, features.switch_sensor, features.temperature],
  },
};

module.exports = {
  SHOJZJ,
};
