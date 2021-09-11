const { features } = require('../utils/features');

/**
 * Meazon managed models.
 */
const Meazon = {
  brand: 'Meazon',
  models: {
    MEAZON_BIZY_PLUG: [features.current, features.power, features.switch, features.voltage],
    MEAZON_DINRAIL: [features.current, features.power, features.switch, features.voltage],
  },
};

module.exports = {
  Meazon,
};
