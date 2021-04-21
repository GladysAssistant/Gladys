const { features } = require('../utils/features');

/**
 * TuYa managed models.
 */
const TuYa = {
  brand: 'TuYa',
  models: {
    TS0121_plug: [features.switch, features.power, features.current, features.voltage, features.energy],
    TS0011: [features.switch],
    TT001ZAV20: [features.temperature, features.humidity],
    SNTZ007: [features.door],
  },
};

module.exports = {
  TuYa,
};
