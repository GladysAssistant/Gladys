const { features } = require('../utils/features');

/**
 * IKEA managed models.
 */
const IKEA = {
  brand: 'IKEA',
  models: {
    LED1545G12: [features.switch, features.brightness, features.color_temperature],
    LED1546G12: [features.switch, features.brightness, features.color_temperature],
    LED1623G12: [features.switch, features.brightness],
    LED1537R6: [features.switch, features.brightness, features.color_temperature],
    LED1650R5: [features.switch, features.brightness],
    LED1536G5: [features.switch, features.brightness, features.color_temperature],
    LED1733G7: [features.switch, features.brightness, features.color_temperature],
    LED1622G12: [features.switch, features.brightness],
    LED1624G9: [features.switch, features.brightness], // color xy
    LED1649C5: [features.switch, features.brightness],
    LED1732G11: [features.switch, features.brightness, features.color_temperature],
    'ICTC-G-1': [features.brightness, features.switch_sensor],
    'ICPSHC24-10EU-IL-1': [features.switch, features.brightness],
    'ICPSHC24-30EU-IL-1': [features.switch, features.brightness],
    L1527: [features.switch, features.brightness, features.color_temperature],
    L1529: [features.switch, features.brightness, features.color_temperature],
    L1528: [features.switch, features.brightness, features.color_temperature],
    L1531: [features.switch, features.brightness, features.color_temperature],
    'E1603/E1702': [features.switch],
    'E1524/E1810': [features.switch_sensor],
    E1743: [features.button],
    E1525: [features.motion],
    // E1746: [], // Signal repeater
  },
};

module.exports = {
  IKEA,
};
