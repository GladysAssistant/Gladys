const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { normalizeDashboardBoxes } = require('../../utils/dashboardSections');

/**
 * @description Get a dashboard by selector.
 * @param {string} userId - The userId querying.
 * @param {string} selector - The selector.
 * @returns {Promise} Resolve with a dashboard.
 * @example
 * gladys.dashboard.getBySelector('main-dashboard');
 */
async function getBySelector(userId, selector) {
  const dashboard = await db.Dashboard.findOne({
    attributes: ['id', 'name', 'selector', 'type', 'visibility', 'user_id', 'created_at', 'updated_at', 'boxes'],
    where: {
      // I can see dashboard I created or public dashboard
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

  const plainDashboard = dashboard.get({ plain: true });
  // Dashboards created before the section-based layout store an array of columns
  plainDashboard.boxes = normalizeDashboardBoxes(plainDashboard.boxes);

  return plainDashboard;
}

module.exports = {
  getBySelector,
};
