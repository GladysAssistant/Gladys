const db = require('../../models');
const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Ask for a cost recalculation of every meter carrying a contract from a date
 * (the "recalculate from" button of the calendars page, section 8.2).
 * @param {string|Date} from - The instant to recompute from.
 * @returns {Promise<object>} { from, electric_meter_device_ids }.
 * @example
 * await recalculate('2026-01-01');
 */
async function recalculate(from) {
  const fromDate = new Date(from);
  if (from === undefined || from === null || Number.isNaN(fromDate.getTime())) {
    throw new BadParameters('from: must be a date');
  }
  const contracts = await db.EnergyContract.findAll({ attributes: ['electric_meter_device_id'] });
  const meterIds = Array.from(new Set(contracts.map((c) => c.electric_meter_device_id)));
  if (meterIds.length > 0) {
    logger.info(
      `Energy contracts: recalculation of ${meterIds.length} meter(s) requested from ${fromDate.toISOString()}`,
    );
    this.event.emit(EVENTS.ENERGY_CONTRACT.RECALCULATE, { from: fromDate, electric_meter_device_ids: meterIds });
  }
  return { from: fromDate.toISOString(), electric_meter_device_ids: meterIds };
}

module.exports = { recalculate };
