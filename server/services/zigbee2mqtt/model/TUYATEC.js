const { features } = require('../utils/features');

/**
 * TUYATEC managed models.
 */
const TUYATEC = {
  brand: 'TUYATEC',
  models: {
    'GDKES-01TZXD': [features.switch_sensor],
    'GDKES-02TZXD': [features.switch_sensor],
    'GDKES-03TZXD': [features.switch_sensor],
    'GDKES-04TZXD': [features.switch_sensor],
  },
};

module.exports = {
  TUYATEC,
};
