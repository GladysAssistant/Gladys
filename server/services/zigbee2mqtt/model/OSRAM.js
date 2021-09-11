const { features } = require('../utils/features');

/**
 * OSRAM managed models.
 */
const OSRAM = {
  brand: 'OSRAM',
  models: {
    '4052899926110': [features.brightness, features.color, features.color_temperature, features.light],
    '4052899926127': [features.brightness, features.light],
    '4052899926158': [features.brightness, features.light],
    '4058075036147': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075036185': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075047853': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075148338': [features.brightness, features.color_temperature, features.light],
    '4058075816459': [features.button],
    '4058075816718': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075816732': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075816794': [features.brightness, features.color_temperature, features.light],
    '4062172044776': [features.brightness, features.light],
    '595UGR22': [features.brightness, features.color_temperature, features.light],
    '73699': [features.brightness, features.color, features.light],
    '73889': [features.brightness, features.light],
    AA68199: [features.brightness, features.color_temperature, features.light],
    AA69697: [features.brightness, features.color, features.color_temperature, features.light],
    AA70155: [features.brightness, features.color_temperature, features.light],
    AB3257001NJ: [features.switch],
    AB32840: [features.brightness, features.color_temperature, features.light],
    AB35996: [features.brightness, features.color, features.color_temperature, features.light],
    AB401130055: [features.brightness, features.color_temperature, features.light],
    AC01353010G: [features.motion, features.temperature],
    'AC0251100NJ/AC0251600NJ/AC0251700NJ': [features.button],
    AC0363900NJ: [features.brightness, features.color_temperature, features.light],
    AC03641: [features.brightness, features.light],
    AC03642: [features.brightness, features.color_temperature, features.light],
    AC03645: [features.brightness, features.color_temperature, features.light],
    AC03647: [features.brightness, features.color_temperature, features.light],
    AC03648: [features.brightness, features.color_temperature, features.light],
    AC08559: [features.brightness, features.color_temperature, features.light],
    'AC08560-DIM': [features.brightness, features.light],
    AC08562: [features.brightness, features.light],
    AC10691: [features.switch],
    'AC10786-DIM': [features.brightness, features.light],
    AC10787: [features.brightness, features.color_temperature, features.light],
    AC16381: [features.brightness, features.color, features.color_temperature, features.light],
    'ST8AU-CON': [features.brightness, features.light],
  },
};

module.exports = {
  OSRAM,
};
