const { features } = require('../utils/features');

/**
 * EcoDim managed models.
 */
const EcoDim = {
  brand: 'EcoDim',
  models: {
    'ED-10010': [features.button],
    'ED-10011': [features.button],
    'ED-10012': [features.button],
    'ED-10013': [features.button],
    'ED-10014': [features.button],
    'ED-10015': [features.button],
    'Eco-Dim.05': [features.brightness, features.light],
    'Eco-Dim.07': [features.brightness, features.light],
  },
};

module.exports = {
  EcoDim,
};
