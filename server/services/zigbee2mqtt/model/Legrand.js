const { features } = require('../utils/features');

/**
 * Legrand managed models.
 */
const Legrand = {
  brand: 'Legrand',
  models: {
    '064873': [features.button],
    '064888': [features.switch],
    '067646': [features.button],
    '067694': [features.button],
    '067771': [features.brightness, features.light],
    '067773': [features.button],
    '067774': [features.button],
    '067775/741811': [features.button, features.current, features.power, features.switch, features.voltage],
    '067776': [features.door],
    '412015': [features.power],
    '752189': [features.button],
    FC80CC: [features.power, features.switch],
    FC80RC: [features.power, features.switch],
    ZLGP15: [features.button],
    'ZLGP17/ZLGP18': [features.button],
  },
};

module.exports = {
  Legrand,
};
