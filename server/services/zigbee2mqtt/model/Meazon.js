const { features } = require('../utils/features');

/**
 * Meazon managed models.
 */
const Meazon = {
  brand: 'Meazon',
  models: {
    MEAZON_BIZY_PLUG: [features.switch, features.power, features.temperature],
    MEAZON_DINRAIL: [features.switch, features.power, features.temperature],
  },
};

module.exports = {
  Meazon,
};
