const { features } = require('../utils/features');

/**
 * Hive managed models.
 */
const Hive = {
  brand: 'Hive',
  models: {
    HALIGHTDIMWWE27: [features.light, features.brightness],
    HALIGHTDIMWWB22: [features.light, features.brightness],
    '1613V': [features.switch, features.power],
    'HV-GSCXZB269': [features.light, features.brightness, features.color_temperature],
    'HV-GSCXZB279_HV-GSCXZB229': [features.light, features.brightness, features.color_temperature],
  },
};

module.exports = {
  Hive,
};
