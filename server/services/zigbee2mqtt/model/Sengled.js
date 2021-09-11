const { features } = require('../utils/features');

/**
 * Sengled managed models.
 */
const Sengled = {
  brand: 'Sengled',
  models: {
    'E11-G13': [features.brightness, features.light],
    'E11-G23/E11-G33': [features.brightness, features.light],
    'E11-N13/E11-N13A/E11-N14/E11-N14A': [features.brightness, features.light],
    'E11-N1EA': [features.brightness, features.color, features.color_temperature, features.light],
    'E11-N1G': [features.brightness, features.light],
    'E11-U21U31': [features.brightness, features.light],
    'E11-U2E': [features.brightness, features.color, features.color_temperature, features.light],
    'E11-U3E': [features.brightness, features.color, features.color_temperature, features.light],
    'E12-N14': [features.brightness, features.light],
    'E12-N1E': [features.brightness, features.color, features.color_temperature, features.light],
    'E13-N11': [features.brightness, features.light, features.motion],
    E1ACA4ABE38A: [features.brightness, features.light],
    'E1C-NB6': [features.switch],
    'E1C-NB7': [features.energy, features.power, features.switch],
    'E1D-G73WNA': [features.door],
    'E1E-G7F': [features.button],
    'E1F-N5E': [features.brightness, features.color, features.color_temperature, features.light],
    'E1G-G8E': [features.brightness, features.color, features.color_temperature, features.light],
    'E21-N13A': [features.brightness, features.light],
    'E21-N1EA': [features.brightness, features.color, features.color_temperature, features.light],
    'Z01-A19NAE26': [features.brightness, features.color_temperature, features.light],
    'Z01-A60EAE27': [features.brightness, features.color_temperature, features.light],
    'Z01-CIA19NAE26': [features.brightness, features.light],
  },
};

module.exports = {
  Sengled,
};
