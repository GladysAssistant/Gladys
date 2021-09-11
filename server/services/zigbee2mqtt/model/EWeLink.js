const { features } = require('../utils/features');

/**
 * eWeLink managed models.
 */
const EWeLink = {
  brand: 'eWeLink',
  models: {
    RHK06: [features.door, features.voltage],
    RHK07: [features.button],
    RHK08: [features.humidity, features.temperature, features.voltage],
    RHK09: [features.motion],
    'SA-003-Zigbee': [features.switch],
    'ZB-SW01': [features.switch],
    'ZB-SW02': [features.switch],
    'ZB-SW03': [features.switch],
    'ZB-SW04': [features.switch],
  },
};

module.exports = {
  EWeLink,
};
