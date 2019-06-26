const db = require('../../models');

/**
 * @description Get areas
 * @example
 * gladys.area.get();
 */
async function get() {
  const areas = await db.Area.findAll();

  const plainAreas = areas.map((area) => area.get({ plain: true }));

  return plainAreas;
}

module.exports = {
  get,
};
