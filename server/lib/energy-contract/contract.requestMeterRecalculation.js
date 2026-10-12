const db = require('../../models');
const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');
const { localToUtcMs } = require('./tariff.time');
const { scheduleBoundedRecalculation } = require('./recalculation.schedule');

/**
 * @description Queue a cost recalculation of one root meter from an instant, when consumption
 * states of that meter (or of a device under it) were written or corrected after the fact: an
 * integration publishing dated consumption (host API `POST /energy/consumption`). Bounded to
 * one per meter per 10 minutes like the calendar recalculations: a request within the window
 * is merged into the next one (its `from` is kept if earlier). Nothing is queued for a meter
 * without a contract, and nothing before the earliest `valid_from` of its contracts: a backfill
 * of years of history only recomputes what a contract prices.
 * @param {string} meterDeviceId - The root electric meter device id.
 * @param {Date} from - Recompute from this instant (the creation instant of the earliest state
 * that changed: the end of a 30-minute interval, the start of a daily one).
 * @returns {Promise<void>} Resolves when queued.
 * @example
 * await requestMeterRecalculation('d1fe2ab9-8c50-4053-ac40-83421f899c59', new Date('2026-01-12T05:30:00Z'));
 */
async function requestMeterRecalculation(meterDeviceId, from) {
  const run = async (pendingFrom) => {
    const contracts = await db.EnergyContract.findAll({
      where: { electric_meter_device_id: meterDeviceId },
      attributes: ['valid_from', 'timezone'],
    });
    if (contracts.length === 0) {
      logger.debug(`Meter ${meterDeviceId}: consumption changed but no contract, no cost to recompute`);
      return;
    }
    const earliestContractMs = Math.min(...contracts.map((c) => localToUtcMs(c.valid_from, c.timezone)));
    const boundedFrom = pendingFrom.getTime() < earliestContractMs ? new Date(earliestContractMs) : pendingFrom;
    logger.info(`Meter ${meterDeviceId}: consumption changed from ${boundedFrom.toISOString()}, recalculating`);
    this.event.emit(EVENTS.ENERGY_CONTRACT.RECALCULATE, {
      from: boundedFrom,
      electric_meter_device_ids: [meterDeviceId],
    });
  };
  // a cached current price reads the accumulations of the stored states (a tiered tariff):
  // they changed now, not when the deferred run starts
  this.clearCurrentPriceCache();
  await scheduleBoundedRecalculation(this.meterRecalculations, meterDeviceId, from, run);
}

module.exports = { requestMeterRecalculation };
