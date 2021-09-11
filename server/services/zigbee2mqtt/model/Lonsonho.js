const { features } = require('../utils/features');

/**
 * Lonsonho managed models.
 */
const Lonsonho = {
  brand: 'Lonsonho',
  models: {
    '11830304': [features.door],
    '4000116784070': [features.switch_sensor],
    'QS-Zigbee-C01': [features.door],
    'QS-Zigbee-D02-TRIAC-2C-L': [features.brightness, features.light],
    'QS-Zigbee-D02-TRIAC-2C-LN': [features.brightness, features.light],
    'QS-Zigbee-D02-TRIAC-L': [features.brightness, features.light],
    'QS-Zigbee-D02-TRIAC-LN': [features.brightness, features.light],
    'QS-Zigbee-S04-2C-LN': [features.switch_sensor],
    'QS-Zigbee-S05-L': [features.switch_sensor],
    'QS-Zigbee-S05-LN': [features.switch_sensor],
    TS0041: [features.button],
    TS0042: [features.button],
    TS0043: [features.button],
    TS0044: [features.button],
    X701: [features.switch_sensor],
    X702: [features.switch_sensor],
    X711A: [features.switch_sensor],
    X712A: [features.switch_sensor],
    X713A: [features.switch_sensor],
    'ZB-RGBCW': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Lonsonho,
};
