const { features } = require('../utils/features');

/**
 * Sinopé managed models.
 */
const Sinope = {
  brand: 'Sinopé',
  models: {
    DM2500ZB: [features.brightness, features.light],
    RM3250ZB: [features.current, features.energy, features.power, features.switch_sensor, features.voltage],
    SP2600ZB: [features.power, features.switch_sensor],
    SW2500ZB: [features.switch_sensor],
    TH1123ZB: [features.current, features.energy, features.power, features.temperature, features.voltage],
    TH1124ZB: [features.current, features.energy, features.power, features.temperature, features.voltage],
    TH1300ZB: [features.temperature],
    TH1400ZB: [features.temperature],
    TH1500ZB: [features.temperature],
    WL4200: [features.water],
    WL4200S: [features.water],
  },
};

module.exports = {
  Sinope,
};
