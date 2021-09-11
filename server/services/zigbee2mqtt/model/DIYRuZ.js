const { features } = require('../utils/features');

/**
 * DIYRuZ managed models.
 */
const DIYRuZ = {
  brand: 'DIYRuZ',
  models: {
    DIYRuZ_AirSense: [features.co2, features.humidity, features.pressure, features.temperature],
    DIYRuZ_Flower: [features.humidity, features.illuminance, features.pressure, features.temperature],
    DIYRuZ_FreePad: [features.button],
    DIYRuZ_Geiger: [features.button],
    // DIYRuZ_KEYPAD20: [],
    DIYRuZ_R4_5: [features.switch],
    DIYRuZ_R8_8: [features.switch],
    DIYRuZ_RT: [features.switch, features.temperature],
    // DIYRuZ_Zintercom: [],
    DIYRuZ_magnet: [features.door],
    DIYRuZ_rspm: [features.button, features.current, features.power, features.switch],
    FreePad_LeTV_8: [features.button],
  },
};

module.exports = {
  DIYRuZ,
};
