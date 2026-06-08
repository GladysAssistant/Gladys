const db = require('../models');
const { SYSTEM_VARIABLE_NAMES } = require('../utils/constants');

module.exports = {
  up: async () => {
    await db.Variable.create({
      name: SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED,
      value: '1',
    });
    await db.Variable.create({
      name: SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_DAY,
      value: '0',
    });
    await db.Variable.create({
      name: SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_HOUR,
      value: '18',
    });
  },

  down: async () => {},
};
