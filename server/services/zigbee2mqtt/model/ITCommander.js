const { features } = require('../utils/features');

/**
 * IT Commander managed models.
 */
const ITCommander = {
  brand: 'IT Commander',
  models: {
    ITCMDR_Click: [features.button, features.voltage],
    ITCMDR_Contact: [features.door, features.voltage],
  },
};

module.exports = {
  ITCommander,
};
