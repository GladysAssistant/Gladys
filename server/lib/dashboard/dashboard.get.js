const db = require('../../models');

const DEFAULT_FIELDS = ['id', 'name', 'selector', 'type', 'updated_at'];

/**
 * @description Get list of dashboard.
 * @param {string} userId - The userId querying.
 * @returns {Promise} Resolve with a list of dashboards.
 * @example
 * gladys.dashboard.get('8445dbc1-679f-4b36-8708-0e9801ac7ffe');
 */
async function get(userId) {
  const dashboards = await db.Dashboard.findAll({
    attributes: DEFAULT_FIELDS,
    where: {
      user_id: userId,
    },
    raw: true,
  });
  return dashboards;
}

module.exports = {
  get,
};
