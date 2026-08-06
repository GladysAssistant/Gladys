const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');

module.exports = {
  up: async () => {
    const dashboards = await db.Dashboard.findAll();
    logger.info(`Weather widgets migration: Found ${dashboards.length} dashboards`);
    await Promise.each(dashboards, async (dashboard) => {
      let changed = false;
      const newBoxes = (dashboard.boxes || []).map((column) =>
        column.map((box) => {
          if (box.type === 'weather' && box.source !== 'meteofrance') {
            changed = true;
            return { ...box, source: 'openweather' };
          }
          return box;
        }),
      );
      if (changed) {
        logger.info(`Weather widgets migration: Updating dashboard ${dashboard.id}`);
        dashboard.set({ boxes: newBoxes });
        await dashboard.save();
      }
    });
  },
  down: async () => {},
};
