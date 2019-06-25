const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a dashboard.
 * @param {string} selector - The selector.
 * @example
 * gladys.dashboard.destroy('main-dashboard');
 */
async function destroy(selector) {
  const dashboard = await db.Dashboard.findOne({
    where: {
      selector,
    },
  });

  if (dashboard === null) {
    throw new NotFoundError('Dashboard not found');
  }

  await dashboard.destroy();
}

module.exports = {
  destroy,
};
