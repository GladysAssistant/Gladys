const { features } = require('../utils/features');

/**
 * Iolloi managed models.
 */
const Iolloi = {
  brand: 'Iolloi',
  models: {
    'ID-EU20FW09': [features.brightness, features.light],
    'ID-UK21FW09': [features.brightness, features.light],
  },
};

module.exports = {
  Iolloi,
};
