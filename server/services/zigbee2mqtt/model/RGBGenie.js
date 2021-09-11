const { features } = require('../utils/features');

/**
 * RGB Genie managed models.
 */
const RGBGenie = {
  brand: 'RGB Genie',
  models: {
    'ZB-3009': [features.button],
    'ZB-5001': [features.button],
    'ZB-5004': [features.button],
    'ZB-5028': [features.button],
    'ZB-5121': [features.button],
    'ZB-5122': [features.button],
    'ZGRC-KEY-013': [features.button],
  },
};

module.exports = {
  RGBGenie,
};
