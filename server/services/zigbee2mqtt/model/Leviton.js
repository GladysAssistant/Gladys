const { features } = require('../utils/features');

/**
 * Leviton managed models.
 */
const Leviton = {
  brand: 'Leviton',
  models: {
    'DG15A-1BW': [features.switch_sensor],
    'DG15S-1BW': [features.switch_sensor],
    'DG6HD-1BW': [features.brightness, features.light],
    'DL15S-1BZ': [features.switch_sensor],
    'RC-2000WH': [features.temperature],
  },
};

module.exports = {
  Leviton,
};
