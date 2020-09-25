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
    'LXZB-02A': [features.switch, features.brightness],
    'HGZB-43': [features.switch],
    'HGZB-043': [features.switch],
    'HGZB-04D': [features.switch, features.brightness],
    'HGZB-042': [features.switch],
    'HGZB-42': [features.switch],
    'HGZB-01A/02A': [features.switch],
    'HGZB-41': [features.switch],
    'MG-AUWS01': [features.switch],
    'HGZB-01A': [features.switch, features.brightness],
    'XY12S-15': [features.switch, features.brightness, features.color_temperature], // color xy
    'HGZB-02A': [features.switch, features.brightness],
    'HGZB-42-UK / HGZB-41': [features.switch],
    'HGZB-06A': [features.switch, features.brightness, features.color_temperature], // color xy
  },
};

module.exports = {
  Nue3A,
};
