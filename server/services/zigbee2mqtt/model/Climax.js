const { features } = require('../utils/features');

/**
 * Climax managed models.
 */
const Climax = {
  brand: 'Climax',
  models: {
    'PSS-23ZBS': [features.switch],
    'SCM-5ZBS': [features.door], // curtain / shutter
    'PSM-29ZBSR': [features.switch],
  },
};

module.exports = {
  Climax,
};
