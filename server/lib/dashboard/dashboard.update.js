const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a dashboard.
 * @param {string} selector - The selector.
 * @param {Object} newDashboard - The new dashboard object.
 * @example
 * gladys.dashboard.update('main-dashboard', {
 *    name: 'new name',
 * });
 */
async function update(selector, newDashboard) {
  const dashboard = await db.Dashboard.findOne({
    where: {
      selector,
    },
  });

  if (dashboard === null) {
    throw new NotFoundError('Dashboard not found');
  }

  const updatedDashboard = await dashboard.update(newDashboard);

  return updatedDashboard.get({ plain: true });
}

module.exports = {
  update,
};
