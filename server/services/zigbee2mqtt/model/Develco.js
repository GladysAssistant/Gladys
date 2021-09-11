const { features } = require('../utils/features');

/**
 * Develco managed models.
 */
const Develco = {
  brand: 'Develco',
  models: {
    'AQSZB-110': [features.humidity, features.temperature],
    'EMIZB-132': [features.current, features.energy, features.power, features.voltage],
    'FLSZB-110': [features.temperature, features.voltage, features.water],
    'HESZB-120': [features.smoke, features.temperature],
    'HMSZB-110': [features.humidity, features.temperature],
    'MOSZB-130': [features.motion],
    'MOSZB-140': [features.motion, features.temperature],
    'MOSZB-141': [features.motion],
    'SMRZB-143': [features.current, features.energy, features.power, features.switch, features.voltage],
    'SMRZB-332': [features.energy, features.power, features.switch],
    'SMSZB-120': [features.smoke, features.temperature],
    'SPLZB-131': [features.current, features.energy, features.power, features.switch, features.voltage],
    'SPLZB-132': [features.current, features.energy, features.power, features.switch, features.voltage],
    'SPLZB-134': [features.current, features.energy, features.power, features.switch, features.voltage],
    'WISZB-120': [features.door, features.temperature],
    'WISZB-121': [features.door],
    ZHEMI101: [features.energy, features.power],
  },
};

module.exports = {
  Develco,
};
