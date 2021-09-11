const { features } = require('../utils/features');

/**
 * EnOcean managed models.
 */
const EnOcean = {
  brand: 'EnOcean',
  models: {
    'PTM 215Z': [features.button],
    'PTM 215ZE': [features.button],
    'PTM 216Z': [features.button],
  },
};

module.exports = {
  EnOcean,
};
