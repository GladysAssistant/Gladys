const db = require('../../models');
const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const logger = require('../../utils/logger');
const { localToUtcMs } = require('./tariff.time');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @description Ask for a cost recalculation of every meter carrying a contract from a date
 * (the "recalculate from" button of the calendars page, section 8.2).
 * @param {string|Date} from - The instant to recompute from; a date alone (`YYYY-MM-DD`, the
 * settings page) is its local midnight in the Gladys timezone, not UTC.
 * @returns {Promise<object>} { from, electric_meter_device_ids }.
 * @example
 * await recalculate('2026-01-01');
 */
async function recalculate(from) {
  let fromDate = new Date(from);
  if (typeof from === 'string' && DATE_ONLY.test(from)) {
    const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
    fromDate = new Date(localToUtcMs(from, timezone));
  }
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
