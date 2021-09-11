const { features } = require('../utils/features');

/**
 * Envilar managed models.
 */
const Envilar = {
  brand: 'Envilar',
  models: {
    'ZG102-BOX-UNIDIM': [features.brightness, features.light],
    'ZG302-BOX-RELAY': [features.switch_sensor],
  },
};

module.exports = {
  Envilar,
};
