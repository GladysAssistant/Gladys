const Promise = require('bluebird');
const db = require('../../models');

/**
 * @description Update a dashboard.
 * @param {string} userId - The userId querying.
 * @param {Array<string>} dashboards - Dashboard selectors new order.
 * @example
 * gladys.dashboard.updateOrder('483b68cb-15ef-4ea3-80df-1e1bed5b402d', ['my-dashboard', 'other-dashboard']);
 */
async function updateOrder(userId, dashboards) {
  // Foreach dashboard, update its position
  await Promise.each(dashboards, async (dashboard, index) => {
    await db.Dashboard.update(
      { position: index },
      {
        where: {
          user_id: userId,
          selector: dashboard,
        },
      },
    );
  });
}

module.exports = {
  updateOrder,
};
