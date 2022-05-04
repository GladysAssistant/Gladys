const db = require('../models');

module.exports = {
  up: async () => {
    await db.DeviceFeatureStateAggregate.destroy({
      where: {
        value: Number.NaN,
      },
    });
  },
  down: async () => {},
};
