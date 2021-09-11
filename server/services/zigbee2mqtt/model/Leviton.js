const { features } = require('../utils/features');

/**
 * Leviton managed models.
 */
const Leviton = {
  brand: 'Leviton',
  models: {
    'DG15A-1BW': [features.switch],
    'DG15S-1BW': [features.switch],
    'DG6HD-1BW': [features.brightness, features.light],
    'DL15S-1BZ': [features.switch],
    'RC-2000WH': [features.temperature],
  },
};

module.exports = {
  Leviton,
};
