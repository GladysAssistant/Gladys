const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a dashboard by selector.
 * @param {string} selector - The selector.
 * @returns {Promise} Resolve with a dashboard.
 * @example
 * gladys.dashboard.getBySelector('main-dashboard');
 */
async function getBySelector(selector) {
  const dashboard = await db.Dashboard.findOne({
    where: {
      selector,
    },
  });

  if (dashboard === null) {
    throw new NotFoundError('Dashboard not found');
  }

  return dashboard.get({ plain: true });
}

module.exports = {
  getBySelector,
};
