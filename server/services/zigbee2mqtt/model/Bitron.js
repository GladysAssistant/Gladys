const { features } = require('../utils/features');

/**
 * Bitron managed models.
 */
const Bitron = {
  brand: 'Bitron',
  models: {
    '902010/128': [features.switch],
    '902010/23': [features.button],
    '902010/24': [features.smoke],
    // '902010/29': [],
    'AV2010/21A': [features.door],
    'AV2010/22': [features.motion],
    'AV2010/22A': [features.motion],
    'AV2010/24A': [features.smoke],
    'AV2010/25': [features.energy, features.power, features.switch],
    'AV2010/26': [features.brightness, features.light],
    // 'AV2010/29A': [],
    'AV2010/32': [features.temperature],
    'AV2010/34': [features.button],
  },
};

module.exports = {
  Bitron,
};
