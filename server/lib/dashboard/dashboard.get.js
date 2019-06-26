const db = require('../../models');

const DEFAULT_FIELDS = ['id', 'name', 'selector', 'type', 'updated_at'];

/**
 * @description Get list of dashboard.
 * @returns {Promise} Resolve with a list of dashboards.
 * @example
 * gladys.dashboard.get();
 */
async function get() {
  const dashboards = await db.Dashboard.findAll({
    attributes: DEFAULT_FIELDS,
  });

  const plainDashboards = dashboards.map((d) => d.get({ plain: true }));
  return plainDashboards;
}

module.exports = {
  get,
};
