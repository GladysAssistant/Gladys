const { features } = require('../utils/features');

/**
 * TUYATEC managed models.
 */
const TUYATEC = {
  brand: 'TUYATEC',
  models: {
    'GDKES-01TZXD': [features.switch],
    'GDKES-02TZXD': [features.switch],
    'GDKES-03TZXD': [features.switch],
    'GDKES-04TZXD': [features.switch],
  },
};

module.exports = {
  TUYATEC,
};
