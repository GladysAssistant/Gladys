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
    'SA-003-Zigbee': [features.switch_sensor],
    'ZB-SW01': [features.switch_sensor],
    'ZB-SW02': [features.switch_sensor],
    'ZB-SW03': [features.switch_sensor],
    'ZB-SW04': [features.switch_sensor],
  },
};

module.exports = {
  EWeLink,
};
