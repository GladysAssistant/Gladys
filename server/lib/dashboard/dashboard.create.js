const db = require('../../models');

/**
 * @description Create a new dashboard.
 * @param {string} userId - The userId querying.
 * @param {Object} dashboard - A dashboard object.
 * @returns {Promise} Resolve with created dashboard.
 * @example
 * gladys.dashboard.create({
 *    name: 'Main',
 *    type: 'main',
 *    boxs: [[]]
 * });
 */
async function create(userId, dashboard) {
  return db.Dashboard.create({ ...dashboard, user_id: userId });
}

module.exports = {
  create,
};
