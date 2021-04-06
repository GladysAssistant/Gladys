const { features } = require('../utils/features');

/**
 * Gledopto managed models.
 */
const Gledopto = {
  brand: 'Gledopto',
  models: {
    'GL-C-008': [features.switch, features.brightness, features.color_temperature], // color xy
    'GL-S-004Z': [features.switch, features.brightness, features.color_temperature],
    'GL-C-006/GL-C-009': [features.switch, features.brightness, features.color_temperature],
    'GL-S-007Z': [features.switch, features.brightness, features.color_temperature],
    'GL-B-001Z': [features.switch, features.brightness, features.color_temperature],
    'GL-G-001Z': [features.switch, features.brightness, features.color_temperature], // color xy
    'GL-B-007Z': [features.switch, features.brightness, features.color_temperature], // color xy
    'GL-B-008Z': [features.switch, features.brightness, features.color_temperature], // color xy
    'GL-D-003Z': [features.switch, features.brightness, features.color_temperature], // color xy
    'GL-S-003Z': [features.switch, features.brightness, features.color_temperature], // color xy
    'GD-CZ-006': [features.switch, features.brightness],
    'GL-FL-004TZ': [features.switch, features.brightness, features.color_temperature], // color xy
  },
};

module.exports = {
  Gledopto,
};
