const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a dashboard.
 * @param {string} userId - The userId querying.
 * @param {string} selector - The selector.
 * @example
 * gladys.dashboard.destroy('main-dashboard');
 */
async function destroy(userId, selector) {
  const dashboard = await db.Dashboard.findOne({
    where: {
      // I can destroy dashboard I created or public dashboard
      [Op.or]: [
        {
          user_id: userId,
        },
        {
          visibility: 'public',
        },
      ],
      selector,
    },
  });

  if (dashboard === null) {
    throw new NotFoundError('Dashboard not found');
  }

  // Explicit cleanup: the ON DELETE CASCADE of t_dashboard_asset only fires
  // when SQLite foreign_keys enforcement is on, which production does not set
  await db.DashboardAsset.destroy({
    where: {
      dashboard_id: dashboard.id,
    },
  });
  await dashboard.destroy();
}

module.exports = {
  destroy,
};
