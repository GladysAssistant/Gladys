const { features } = require('../utils/features');

/**
 * Nue / 3A managed models.
 */
const Nue3A = {
  brand: 'Nue / 3A',
  models: {
    '3A12S-15': [features.brightness, features.color, features.color_temperature, features.light],
    'HGZB-01': [features.switch_sensor],
    'HGZB-01A': [features.switch_sensor],
    'HGZB-02A': [features.brightness, features.light],
    'HGZB-02S': [features.button, features.switch_sensor],
    'HGZB-042': [features.switch_sensor],
    'HGZB-043': [features.switch_sensor],
    'HGZB-045': [features.button, features.switch_sensor],
    'HGZB-04D / HGZB-4D-UK': [features.brightness, features.light],
    'HGZB-06A': [features.brightness, features.color, features.color_temperature, features.light],
    'HGZB-13A': [features.door],
    'HGZB-14A': [features.water],
    'HGZB-1S': [features.button, features.switch_sensor],
    'HGZB-20-UK': [features.switch_sensor],
    'HGZB-20A': [features.switch_sensor],
    'HGZB-41': [features.switch_sensor],
    'HGZB-42': [features.switch_sensor],
    'HGZB-42-UK / HGZB-41 / HGZB-41-UK': [features.switch_sensor],
    'HGZB-43': [features.switch_sensor],
    'HGZB-44': [features.switch_sensor],
    'HGZB-DLC4-N12B': [features.brightness, features.color, features.color_temperature, features.light],
    'LXN59-2S7LX1.0': [features.switch_sensor],
    'LXZB-02A': [features.brightness, features.light],
    'MG-AUWS01': [features.switch_sensor],
    'NUE-ZBFLB': [features.switch_sensor],
    'WL-SD001-9W': [features.brightness, features.color, features.color_temperature, features.light],
    'XY12S-15': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Nue3A,
};
