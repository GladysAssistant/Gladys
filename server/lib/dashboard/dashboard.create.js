const db = require('../../models');

/**
 * @description Create a new dashboard.
 * @param {string} userId - The userId querying.
 * @param {object} dashboard - A dashboard object.
 * @returns {Promise} Resolve with created dashboard.
 * @example
 * gladys.dashboard.create({
 *    name: 'Main',
 *    type: 'main',
 *    boxs: [[]]
 * });
 */
async function create(userId, dashboard) {
  // We try to find if one dashboard already exist, if yes we use the position of this dashboard + 1
  const dashboardWithTheHighestPosition = await db.Dashboard.findAll({
    attributes: ['position'],
    where: {
      user_id: userId,
    },
    order: [['position', 'desc']],
    limit: 1,
    raw: true,
  });
  if (dashboardWithTheHighestPosition.length > 0) {
    dashboard.position = dashboardWithTheHighestPosition[0].position + 1;
  }
  return db.Dashboard.create({ ...dashboard, user_id: userId });
}

module.exports = {
  create,
};
