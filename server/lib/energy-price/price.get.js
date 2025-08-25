const db = require('../../models');

/**
 * @description Get energy prices.
 * @param {object} [options] - Optional filters.
 * @returns {Promise<Array>} List of energy prices.
 * @example
 * await get({ contract: 'base', price_type: 'consumption' });
 */
async function get(options = {}) {
  const where = {};
  if (options.electric_meter_device_id) {
    where.electric_meter_device_id = options.electric_meter_device_id;
  }
  if (options.contract) {
    where.contract = options.contract;
  }
  if (options.price_type) {
    where.price_type = options.price_type;
  }
  if (options.currency) {
    where.currency = options.currency;
  }
  if (options.day_type) {
    where.day_type = options.day_type;
  }
  if (options.start_date) {
    where.start_date = options.start_date;
  }
  if (options.end_date) {
    where.end_date = options.end_date;
  }
  const rows = await db.EnergyPrice.findAll({ where, order: [['start_date', 'ASC']] });
  return rows.map((r) => r.get({ plain: true }));
}

module.exports = { get };
