const db = require('../models');
const { SYSTEM_VARIABLE_NAMES } = require('../utils/constants');

module.exports = {
  up: async () => {
    await db.Variable.create({
      name: SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED,
      value: true,
    });
    await db.Variable.create({
      name: SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD,
      value: '10',
    });
  },

  down: async () => {},
};
