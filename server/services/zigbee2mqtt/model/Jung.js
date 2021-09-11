const { features } = require('../utils/features');

/**
 * Jung managed models.
 */
const Jung = {
  brand: 'Jung',
  models: {
    ZLLA5004M: [features.button],
    ZLLCD5004M: [features.button],
    ZLLHS4: [features.button],
    ZLLLS5004M: [features.button],
  },
};

module.exports = {
  Jung,
};
