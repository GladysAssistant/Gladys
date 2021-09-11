const { features } = require('../utils/features');

/**
 * BlitzWolf managed models.
 */
const BlitzWolf = {
  brand: 'BlitzWolf',
  models: {
    'BW-IS2': [features.door],
    'BW-IS3': [features.motion],
    'BW-SHP13': [features.current, features.energy, features.power, features.switch_sensor, features.voltage],
    'BW-SS7_1gang': [features.switch_sensor],
    'BW-SS7_2gang': [features.switch_sensor],
  },
};

module.exports = {
  BlitzWolf,
};
