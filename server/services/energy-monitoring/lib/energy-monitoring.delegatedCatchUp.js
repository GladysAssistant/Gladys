const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { ENERGY_CONTRACT_PRICING_MODES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { queueWrapper } = require('../utils/queueWrapper');
const { getLocalContext } = require('../../../lib/energy-contract/tariff.time');
const { findConsumptionCostPairs } = require('./energy-monitoring.calculateCostFrom');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;
// A delegated contract catches up from the oldest interval without a cost, at most 31 days back
const CATCH_UP_MAX_DAYS = 31;

/**
 * @description Recompute the costs of the delegated meters from the oldest interval without a
 * cost: the job part of the catch-up, created only when there is something to catch up.
 * @param {Date} from - The start of the oldest interval without a cost.
 * @param {Array<string>} meterIds - The meters whose active contract is delegated.
 * @param {string} [jobId] - The job id.
 * @returns {Promise<object>} The calculateCostFrom result.
 * @example
 * await catchUpDelegatedFrom(new Date(), ['meter-id']);
 */
async function catchUpDelegatedFrom(from, meterIds, jobId) {
  logger.info(`Delegated energy contracts: catching up from ${from.toISOString()}`);
  return this.calculateCostFrom(from, jobId, { electricMeterDeviceIds: meterIds });
}

/**
 * @description Catch-up of the delegated contracts (capability file, section 4): find the
 * oldest consumption interval of the last 31 days that has no cost state while a delegated
 * contract covers it, and recompute from there, for the meters whose active contract is
 * delegated. No job is created when there is nothing to catch up.
 * @returns {Promise<null>} Return when finished.
 * @example
 * await delegatedCatchUp();
 */
async function delegatedCatchUp() {
  return queueWrapper(this.queue, async () => {
    const delegatedContracts = (
      await this.gladys.energyContract.get({ pricing_mode: ENERGY_CONTRACT_PRICING_MODES.DELEGATED })
    ).filter((c) => c.provider_service_id !== null);
    const meterIds = new Set(
      delegatedContracts.filter((c) => c.status === 'active').map((c) => c.electric_meter_device_id),
    );
    if (meterIds.size === 0) {
      return null;
    }
    // an interval no delegated contract covers never gets a cost from the catch-up: before the
    // contract's valid_from, it belongs to another contract or to none
    const isCovered = (meterId, startsAtMs) =>
      delegatedContracts.some((c) => {
        if (c.electric_meter_device_id !== meterId) {
          return false;
        }
        const { date } = getLocalContext(startsAtMs, c.timezone);
        return c.valid_from <= date && (c.valid_to === null || c.valid_to >= date);
      });
    const now = new Date();
    const windowStart = new Date(now.getTime() - CATCH_UP_MAX_DAYS * ONE_DAY_MS);
    const energyDevices = await this.gladys.device.get({ device_feature_category: 'energy-sensor' });
    let oldestMissing = null;
    await Promise.each(energyDevices, async (energyDevice) => {
      const pairs = findConsumptionCostPairs(energyDevice).filter(
        (pair) => pair.consumptionFeature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );
      await Promise.each(pairs, async (pair) => {
        const root = this.gladys.device.energySensorManager.getRootElectricMeterDevice(pair.consumptionFeature);
        if (!root || !meterIds.has(root.device_id)) {
          return;
        }
        const consumption = await this.gladys.device.getDeviceFeatureStates(
          pair.consumptionFeature.selector,
          windowStart,
          now,
        );
        const costs = await this.gladys.device.getDeviceFeatureStates(
          pair.consumptionCostFeature.selector,
          windowStart,
          now,
        );
        const costTimes = new Set(costs.map((s) => new Date(s.created_at).getTime()));
        const missing = consumption.find((s) => {
          const createdAtMs = new Date(s.created_at).getTime();
          return !costTimes.has(createdAtMs) && isCovered(root.device_id, createdAtMs - THIRTY_MINUTES_IN_MS);
        });
        if (missing) {
          const missingMs = new Date(missing.created_at).getTime() - THIRTY_MINUTES_IN_MS;
          if (oldestMissing === null || missingMs < oldestMissing) {
            oldestMissing = missingMs;
          }
        }
      });
    });
    if (oldestMissing === null) {
      return null;
    }
    await this.catchUpDelegatedFrom(new Date(oldestMissing), Array.from(meterIds));
    return null;
  });
}

module.exports = { delegatedCatchUp, catchUpDelegatedFrom, CATCH_UP_MAX_DAYS };
