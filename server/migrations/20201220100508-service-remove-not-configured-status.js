const db = require('../models');

module.exports = {
  up: async () => {
    await db.Service.update(
      {
        status: 'RUNNING',
      },
      {
        where: {
          status: ['NOT_CONFIGURED', 'STOPPED'],
        },
      },
    );
  },
  down: async () => {},
};
