const db = require('../models');

module.exports = {
  up: async () => {
    await db.DeviceFeatureState.destroy({
      where: {
        value: Number.NaN,
      },
    });
  },
  down: async () => {},
};
