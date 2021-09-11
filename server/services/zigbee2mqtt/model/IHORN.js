const { features } = require('../utils/features');

/**
 * iHORN managed models.
 */
const IHORN = {
  brand: 'iHORN',
  models: {
    'HO-09ZB': [features.door],
    // 'LH-09521': [],
    'LH-32ZB': [features.humidity, features.temperature],
    'LH-990F': [features.motion],
    'LH-990ZB': [features.motion],
    'LH-992ZB': [features.motion],
  },
};

module.exports = {
  IHORN,
};
