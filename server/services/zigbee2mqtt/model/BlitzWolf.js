const { features } = require('../utils/features');

/**
 * BlitzWolf managed models.
 */
const BlitzWolf = {
  brand: 'BlitzWolf',
  models: {
    'BW-IS2': [features.door],
    'BW-IS3': [features.motion],
    'BW-SHP13': [features.current, features.energy, features.power, features.switch, features.voltage],
    'BW-SS7_1gang': [features.switch],
    'BW-SS7_2gang': [features.switch],
  },
};

module.exports = {
  BlitzWolf,
};
