const { features } = require('../utils/features');

/**
 * Climax managed models.
 */
const Climax = {
  brand: 'Climax',
  models: {
    'CO-8ZBS': [features.smoke],
    'PSM-29ZBSR': [features.energy, features.power, features.switch],
    'PSS-23ZBS': [features.switch],
    'RS-23ZBS': [features.humidity, features.temperature],
    'SCM-5ZBS': [features.door],
    'SD-8SCZBS': [features.smoke],
    // 'SRAC-23B-ZBSR': [],
    'WLS-15ZBS': [features.water],
    'WS-15ZBS': [features.water],
  },
};

module.exports = {
  Climax,
};
