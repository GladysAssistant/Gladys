const { features } = require('../utils/features');

/**
 * TuYa managed models.
 */
const TuYa = {
  brand: 'TuYa',
  models: {
    TS0121_plug: [features.switch, features.power, features.current, features.voltage, features.energy],
    TS0201: [features.temperature, features.humidity, features.voltage],
    TS0011: [features.switch],
    TS0601_air_quality_sensor: [features.temperature, features.humidity, features.co2],
    TT001ZAV20: [features.temperature, features.humidity],
    SNTZ007: [features.door],
    TS0503B: [features.light, features.brightness, features.color],
  },
};

module.exports = {
  TuYa,
};
