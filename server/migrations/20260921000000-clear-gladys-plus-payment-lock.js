const db = require('../models');
const logger = require('../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../utils/constants');

// Gladys 5.0.4 locks the Gladys Plus features of the instance when Gladys Plus
// answers "payment required" (402), and persists the lock in this variable.
// Until Gladys Plus 1.4.0, the server answered the same 402 to a paid account
// calling a route its plan does not include (a Lite account listing the
// backups, which every instance does nightly), so the Lite instances locked
// themselves. The lock is only lifted by a successful call to that same
// route, which a Lite account can never make: those instances are stuck with
// a "payment required" banner, whatever their subscription. Gladys Plus now
// answers 403 in that case, so the lock is dropped once here; a subscription
// really unpaid is locked again by the next call to Gladys Plus.
module.exports = {
  up: async () => {
    const deleted = await db.Variable.destroy({
      where: {
        name: SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE,
      },
    });
    if (deleted > 0) {
      logger.info('Gladys Plus payment lock cleared, the subscription is checked again on the next call.');
    }
  },

  down: async () => {},
};
