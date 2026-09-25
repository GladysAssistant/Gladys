const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { ENERGY_CONTRACT_PRICING_MODES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { queueWrapper } = require('../utils/queueWrapper');
const { findConsumptionCostPairs } = require('./energy-monitoring.calculateCostFrom');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// A delegated contract catches up from the oldest interval without a cost, at most 31 days back
const CATCH_UP_MAX_DAYS = 31;

/**
 * @description Catch-up of the delegated contracts (capability file, section 4): find the
 * oldest consumption interval of the last 31 days that has no cost state and recompute
 * from there, for the meters whose active contract is delegated.
 * @param {string} [jobId] - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * await delegatedCatchUp();
 */
async function delegatedCatchUp(jobId) {
  return queueWrapper(this.queue, async () => {
    const contracts = (
      await this.gladys.energyContract.get({ pricing_mode: ENERGY_CONTRACT_PRICING_MODES.DELEGATED })
    ).filter((c) => c.status === 'active' && c.provider_service_id !== null);
    if (contracts.length === 0) {
      return null;
    }
    const meterIds = new Set(contracts.map((c) => c.electric_meter_device_id));
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
        const missing = consumption.find((s) => !costTimes.has(new Date(s.created_at).getTime()));
        if (missing) {
          const missingMs = new Date(missing.created_at).getTime() - 30 * 60 * 1000;
          if (oldestMissing === null || missingMs < oldestMissing) {
            oldestMissing = missingMs;
          }
        }
      });
    });
    if (oldestMissing === null) {
      return null;
    }
    logger.info(`Delegated energy contracts: catching up from ${new Date(oldestMissing).toISOString()}`);
    await this.calculateCostFrom(new Date(oldestMissing), jobId, { electricMeterDeviceIds: Array.from(meterIds) });
    return null;
  });
}

module.exports = { delegatedCatchUp, CATCH_UP_MAX_DAYS };
