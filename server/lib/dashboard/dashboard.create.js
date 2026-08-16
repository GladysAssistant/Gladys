const db = require('../../models');
const { slugify } = require('../../utils/slugify');

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
  let dashboardWithSelector = dashboard;
  // Like scenes, the selector of a new dashboard gets random characters at the
  // end so two dashboards with names sharing the same slug don't collide.
  // A selector explicitly given by the caller is always kept as is, and
  // existing dashboards keep the selector they were created with.
  if (!dashboard.selector && dashboard.name) {
    dashboardWithSelector = {
      ...dashboard,
      selector: slugify(dashboard.name, true),
    };
  }
  return db.Dashboard.create({ ...dashboardWithSelector, user_id: userId });
}

module.exports = {
  create,
};
