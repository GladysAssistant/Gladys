const { features } = require('../utils/features');

/**
 * Earda managed models.
 */
const Earda = {
  brand: 'Earda',
  models: {
    'EDM-1ZAA-EU': [features.brightness, features.light],
    'EDM-1ZAB-EU': [features.brightness, features.light],
    'EDM-1ZBA-EU': [features.brightness, features.light],
    'ESW-2ZAA-EU': [features.switch],
  },
};

module.exports = {
  Earda,
};
