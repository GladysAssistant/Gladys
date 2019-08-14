const { features } = require('../utils/features');

/**
 * RGBGenie managed models.
 */
const RGBGenie = {
  brand: 'RGB Genie',
  models: {
    'ZGRC-KEY-013': [features.switch_sensor],
  },
};

module.exports = {
  RGBGenie,
};
