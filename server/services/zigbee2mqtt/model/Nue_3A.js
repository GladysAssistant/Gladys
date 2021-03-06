const { features } = require('../utils/features');

/**
 * Nue / 3A managed models.
 */
const Nue3A = {
  brand: 'Nue / 3A',
  models: {
    'HGZB-1S': [features.switch, features.switch_sensor],
    'HGZB-02S': [features.switch, features.switch_sensor],
    'HGZB-045': [features.switch, features.switch_sensor],
    'LXZB-02A': [features.light, features.brightness],
    'HGZB-43': [features.switch],
    'HGZB-043': [features.switch],
    'HGZB-04D': [features.light, features.brightness],
    'HGZB-042': [features.switch],
    'HGZB-42': [features.switch],
    'HGZB-01A/02A': [features.switch],
    'HGZB-41': [features.switch],
    'MG-AUWS01': [features.switch],
    'HGZB-01A': [features.light, features.brightness],
    'XY12S-15': [features.light, features.brightness, features.color_temperature, features.color],
    'HGZB-02A': [features.light, features.brightness],
    'HGZB-42-UK / HGZB-41': [features.switch],
    'HGZB-06A': [features.light, features.brightness, features.color_temperature, features.color],
  },
};

module.exports = {
  Nue3A,
};
