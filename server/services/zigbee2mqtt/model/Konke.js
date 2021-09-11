const { features } = require('../utils/features');

/**
 * Konke managed models.
 */
const Konke = {
  brand: 'Konke',
  models: {
    '2AJZ4KPBS': [features.motion],
    '2AJZ4KPDR': [features.door],
    '2AJZ4KPFT': [features.humidity, features.temperature],
    '2AJZ4KPKEY': [features.button],
    LH07321: [features.water],
    'TW-S1': [features.smoke],
  },
};

module.exports = {
  Konke,
};
