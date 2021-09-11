const { features } = require('../utils/features');

/**
 * Moes managed models.
 */
const Moes = {
  brand: 'Moes',
  models: {
    'AM43-0.45/40-ES-EB': [features.door],
    'BHT-002-GCLZB': [features.door, features.temperature],
    'BRT-100-TRV': [features.door, features.switch, features.temperature],
    HY368: [features.door, features.switch, features.temperature],
    HY369RT: [features.door, features.switch, features.temperature],
    'MS-104BZ': [features.switch],
    'MS-104Z': [features.switch],
    'MS-105B': [features.brightness, features.light],
    'MS-105Z': [features.brightness, features.light],
    'MS-108ZR': [features.door],
    'WS-EUB1-ZG': [features.switch],
    'ZK-CH-2U': [features.switch],
    'ZK-EU-2U': [features.switch],
    'ZLD-RCW': [features.brightness, features.color, features.color_temperature, features.light],
    'ZSS-ZK-THL': [features.humidity, features.illuminance, features.temperature],
    'ZTS-EU_1gang': [features.switch],
    'ZTS-EU_2gang': [features.switch],
    'ZTS-EU_3gang': [features.switch],
  },
};

module.exports = {
  Moes,
};
