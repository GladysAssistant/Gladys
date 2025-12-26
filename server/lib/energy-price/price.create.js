const db = require('../../models');

/**
 * @description Create an energy price entry.
 * @param {object} data - Energy price payload.
 * @returns {Promise<object>} Created row.
 * @example
 * await create({
 *   electrical_meter_device_id: '17488546-e1b8-4cb9-bd75-e20526a94a99',
 *   contract: 'base',
 *   price_type: 'consumption',
 *   currency: 'euro',
 *   start_date: '2025-01-01',
 *   price: 20
 * });
 */
async function create(data) {
  const row = await db.EnergyPrice.create(data);
  return row.get({ plain: true });
}

module.exports = { create };
