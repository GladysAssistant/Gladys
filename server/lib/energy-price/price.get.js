const db = require('../../models');

/**
 * @description Get energy prices.
 * @param {object} [options] - Optional filters.
 * @returns {Promise<Array>} List of energy prices.
 * @example
 * await get();
 */
async function get(options = {}) {
  const where = {};
  if (options.electric_meter_device_id) {
    where.electric_meter_device_id = options.electric_meter_device_id;
  }
  const rows = await db.EnergyPrice.findAll({ where, order: [['start_date', 'ASC']] });
  return rows.map((r) => r.get({ plain: true }));
}

module.exports = { get };
