const { features } = require('../utils/features');

/**
 * Xiaomi managed models.
 */
const Xiaomi = {
  brand: 'Xiaomi',
  models: {
    ZNLDP12LM: [features.light, features.brightness, features.color_temperature],
    WXKG01LM: [features.button],
    WXKG11LM: [features.button],
    WXKG12LM: [features.button],
    WXKG03LM_rev1: [features.button],
    WXKG03LM_rev2: [features.button],
    WXKG02LM_rev1: [features.button],
    WXKG02LM_rev2: [features.button],
    QBKG04LM: [features.switch],
    QBKG11LM: [features.switch, features.power],
    QBKG03LM: [features.switch_sensor],
    QBKG12LM: [features.switch, features.power],
    WSDCGQ01LM: [features.temperature, features.humidity],
    WSDCGQ11LM: [features.temperature, features.humidity, features.pressure],
    RTCGQ01LM: [features.motion],
    RTCGQ11LM: [features.motion, features.illuminance, features.temperature, features.voltage],
    MCCGQ01LM: [features.door],
    MCCGQ11LM: [features.door, features.temperature],
    SJCGQ11LM: [features.water],
    MFKZQ01LM: [features.button],
    ZNCZ02LM: [features.switch, features.power],
    QBCZ11LM: [features.switch, features.power],
    'JTYJ-GD-01LM/BW': [features.smoke],
    'JTQJ-BF-01LM/BW': [features.smoke, features.gas_density],
    A6121: [features.door],
    DJT11LM: [features.button],
    // ZNCLDJ11LM: [features.curtain]
    LLKZMK11LM: [features.switch, features.power],
    ZNMS12LM: [features.switch_sensor, features.door],
    WXKG06LM: [features.button],
  },
};

module.exports = {
  Xiaomi,
};
