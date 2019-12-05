const { features } = require('../utils/features');

/**
 * Xiaomi managed models.
 */
const Xiaomi = {
  brand: 'Xiaomi',
  models: {
    ZNLDP12LM: [features.switch, features.brightness, features.color_temperature],
    WXKG01LM: [features.switch_sensor],
    WXKG11LM: [features.button],
    WXKG12LM: [features.switch_sensor],
    WXKG03LM: [features.switch_sensor],
    WXKG02LM: [features.switch_sensor],
    QBKG04LM: [features.switch_sensor],
    QBKG11LM: [features.switch, features.power],
    QBKG03LM: [features.switch_sensor],
    QBKG12LM: [features.switch, features.power],
    WSDCGQ01LM: [features.temperature, features.humidity],
    WSDCGQ11LM: [features.temperature, features.humidity, features.pressure],
    RTCGQ01LM: [features.motion],
    RTCGQ11LM: [features.motion, features.illuminance],
    MCCGQ01LM: [features.door],
    MCCGQ11LM: [features.door],
    SJCGQ11LM: [features.water],
    MFKZQ01LM: [features.switch_sensor],
    ZNCZ02LM: [features.switch, features.power],
    QBCZ11LM: [features.switch, features.power],
    'JTYJ-GD-01LM/BW': [features.smoke],
    'JTQJ-BF-01LM/BW': [features.smoke, features.gas_density],
    A6121: [features.door],
    DJT11LM: [features.switch_sensor],
    // ZNCLDJ11LM: [features.curtain]
    LLKZMK11LM: [features.switch, features.power],
    ZNMS12LM: [features.switch_sensor, features.door],
  },
};

module.exports = {
  Xiaomi,
};
