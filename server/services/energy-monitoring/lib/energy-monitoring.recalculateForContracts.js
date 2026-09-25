const { queueWrapper } = require('../utils/queueWrapper');
const logger = require('../../../utils/logger');

/**
 * @description Recompute the costs of some root meters from a date: the handler of the
 * `energy-contract.recalculate` event (a contract created, changed or deleted, or a
 * calendar value changed, docs/specs/energy-contracts.md 7.4).
 * @param {object} payload - { from: Date, electric_meter_device_ids: [], calendar_key? }.
 * @param {string} [jobId] - The job id.
 * @returns {Promise<object>} { devices, failures } of the cost calculation.
 * @example
 * await recalculateForContracts({ from: new Date(), electric_meter_device_ids: ['…'] });
 */
async function recalculateForContracts(payload, jobId) {
  return queueWrapper(this.queue, async () => {
    const from = new Date(payload.from);
    logger.info(
      `Recalculating energy costs from ${from.toISOString()} for ${payload.electric_meter_device_ids.length} meter(s)${
        payload.calendar_key ? ` (calendar ${payload.calendar_key})` : ''
      }`,
    );
    return this.calculateCostFrom(from, jobId, { electricMeterDeviceIds: payload.electric_meter_device_ids });
  });
}

module.exports = { recalculateForContracts };
