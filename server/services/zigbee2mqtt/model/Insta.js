const { features } = require('../utils/features');

/**
 * Insta managed models.
 */
const Insta = {
  brand: 'Insta',
  models: {
    '57008000': [features.door],
    InstaRemote: [features.button],
  },
};

module.exports = {
  Insta,
};
