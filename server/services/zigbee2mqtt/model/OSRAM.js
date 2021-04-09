const { features } = require('../utils/features');

/**
 * OSRAM managed models.
 */
const OSRAM = {
  brand: 'OSRAM',
  models: {
    '4058075816718': [features.light, features.brightness, features.color_temperature], // color xy
    AA69697: [features.light, features.brightness, features.color_temperature], // color xy
    AC03645: [features.light, features.brightness, features.color_temperature], // color xy
    AC03642: [features.light, features.brightness, features.color_temperature],
    AC03647: [features.light, features.brightness, features.color_temperature], // color xy
    AA70155: [features.light, features.brightness, features.color_temperature],
    AA68199: [features.light, features.brightness, features.color_temperature],
    AB32840: [features.light, features.brightness, features.color_temperature],
    '4058075816794': [features.light, features.brightness, features.color_temperature],
    AC03641: [features.light, features.brightness],
    '4052899926158': [features.light, features.brightness],
    AB401130055: [features.light, features.brightness, features.color_temperature],
    AB3257001NJ: [features.switch],
    '4052899926110': [features.light, features.brightness, features.color_temperature], // color xy
    '4058075036185': [features.light, features.brightness, features.color_temperature], // color xy
    '4058075036147': [features.light, features.brightness, features.color_temperature], // color xy
    AC0363900NJ: [features.light, features.brightness, features.color_temperature], // color xy
    AB35996: [features.light, features.brightness, features.color_temperature], // color xy
    AC08562: [features.light, features.brightness],
    AC01353010G: [features.temperature, features.motion],
    AC03648: [features.light, features.brightness, features.color_temperature],
    AC0251100NJ: [features.switch_sensor],
    'ST8AU-CON': [features.light, features.brightness],
  },
};

module.exports = {
  OSRAM,
};
