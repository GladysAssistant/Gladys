const db = require('../../models');

/**
 * @description Init areas in local RAM.
 * @returns {Promise} Resolve.
 * @example
 * gladys.device.init();
 */
async function init() {
  const areas = await db.Area.findAll();
  this.areas = areas.map((area) => area.get({ plain: true }));
}

module.exports = { init };
