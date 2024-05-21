const { Op } = require('sequelize');

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a dashboard.
 * @param {string} userId - The userId querying.
 * @param {string} selector - The selector.
 * @param {object} newDashboard - The new dashboard object.
 * @returns {Promise<object>} Return dashboard updated.
 * @example
 * gladys.dashboard.update('main-dashboard', {
 *    name: 'new name',
 * });
 */
async function update(userId, selector, newDashboard) {
  const dashboard = await db.Dashboard.findOne({
    where: {
      // I can edit dashboard I created or public dashboard
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

  const updatedDashboard = await dashboard.update(newDashboard);

  return updatedDashboard.get({ plain: true });
}

module.exports = {
  update,
};
