const { features } = require('../utils/features');

/**
 * Innr managed models.
 */
const Innr = {
  brand: 'Innr',
  models: {
    'RB 185 C': [features.switch, features.brightness, features.color_temperature], // color xy
    'BY 185 C': [features.switch, features.brightness, features.color_temperature], // color xy
    'RB 250 C': [features.switch, features.brightness, features.color_temperature], // color xy
    'RB 265': [features.switch, features.brightness],
    'RB 278 T': [features.switch, features.brightness],
    'RB 285 C': [features.switch, features.brightness, features.color_temperature], // color xy
    'BY 285 C': [features.switch, features.brightness, features.color_temperature], // color xy
    'RB 165': [features.switch, features.brightness],
    'RB 175 W': [features.switch, features.brightness],
    'RB 178 T': [features.switch, features.brightness, features.color_temperature],
    'RS 122': [features.switch, features.brightness],
    'RS 125': [features.switch, features.brightness],
    'RS 225': [features.switch, features.brightness],
    'RS 128 T': [features.switch, features.brightness, features.color_temperature],
    'RS 228 T': [features.switch, features.brightness, features.color_temperature],
    'RB 145': [features.switch, features.brightness],
    'RB 245': [features.switch, features.brightness],
    'RB 248 T': [features.switch, features.brightness, features.color_temperature],
    'BY 165': [features.switch, features.brightness],
    'PL 110': [features.switch, features.brightness],
    'ST 110': [features.switch, features.brightness],
    'UC 110': [features.switch, features.brightness],
    'DL 110 N': [features.switch, features.brightness],
    'DL 110 W': [features.switch, features.brightness],
    'SL 110 N': [features.switch, features.brightness],
    'SL 110 M': [features.switch, features.brightness],
    'SL 110 W': [features.switch, features.brightness],
    'SP 120': [features.switch, features.power],
  },
};

module.exports = {
  Innr,
};
