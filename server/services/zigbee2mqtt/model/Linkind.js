const { features } = require('../utils/features');

/**
 * Linkind managed models.
 */
const Linkind = {
  brand: 'Linkind',
  models: {
    LS21001: [features.water],
    'ZL1000100-CCT-US-V1A02': [features.brightness, features.color_temperature, features.light],
    ZL100010008: [features.brightness, features.light],
    'ZL1000400-CCT-EU-2-V1A02': [features.brightness, features.color_temperature, features.light],
    ZL100050004: [features.brightness, features.color_temperature, features.light],
    'ZL1000700-22-EU-V1A02': [features.brightness, features.light],
    'ZL1000701-27-EU-V1A02': [features.brightness, features.light],
    'ZS1100400-IN-V1A02': [features.motion],
    ZS110050078: [features.door],
    ZS130000178: [features.button],
    ZS190000118: [features.switch],
    ZS230002: [features.button],
    ZS232000178: [features.button],
  },
};

module.exports = {
  Linkind,
};
