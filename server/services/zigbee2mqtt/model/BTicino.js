const { features } = require('../utils/features');

/**
 * BTicino managed models.
 */
const BTicino = {
  brand: 'BTicino',
  models: {
    F20T60A: [features.power, features.switch_sensor],
    'K4003C/L4003C/N4003C/NT4003C': [features.button, features.switch_sensor],
    'K4027C/L4027C/N4027C/NT4027C': [features.door],
    'L441C/N4411C/NT4411C': [features.brightness, features.light],
    L4531C: [features.button, features.current, features.power, features.switch_sensor, features.voltage],
  },
};

module.exports = {
  BTicino,
};
