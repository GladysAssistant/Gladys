const db = require('../../models');

/**
 * @description Create a new dashboard.
 * @param {Object} dashboard - A dashboard object.
 * @returns {Promise} Resolve with created dashboard.
 * @example
 * gladys.dashboard.create({
 *    name: 'Main',
 *    type: 'main',
 *    boxs: [[]]
 * });
 */
async function create(dashboard) {
  return db.Dashboard.create(dashboard);
}

module.exports = {
  create,
};
