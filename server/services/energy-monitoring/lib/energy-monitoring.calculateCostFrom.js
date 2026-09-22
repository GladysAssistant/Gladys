const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  ENERGY_CONTRACT_PRICING_MODES,
} = require('../../../utils/constants');
const { convertEnergyUnit } = require('../../../utils/units');
const {
  getLocalContext,
  getDayBounds,
  getMonthBounds,
  getBillingPeriodBounds,
} = require('../../../lib/energy-contract/tariff.time');

const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;
const DAILY_DURATION_MINUTES = 24 * 60;

/**
 * @description Pair every consumption feature of a device with its cost feature
 * (linked through energy_parent_id): 30-minute features first, daily ones only when
 * the device has no 30-minute feature.
 * @param {object} energyDevice - The device with its features.
 * @returns {Array<object>} [{ consumptionFeature, consumptionCostFeature, durationMinutes }].
 * @example
 * findConsumptionCostPairs(device);
 */
function findConsumptionCostPairs(energyDevice) {
  const pairs = [];
  const collect = (consumptionType, costType, durationMinutes) => {
    energyDevice.features
      .filter((f) => f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR && f.type === consumptionType)
      .forEach((consumptionFeature) => {
        const costFeature = energyDevice.features.find(
          (f) =>
            f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
            f.type === costType &&
            f.energy_parent_id === consumptionFeature.id,
        );
        if (costFeature) {
          pairs.push({ consumptionFeature, consumptionCostFeature: costFeature, durationMinutes });
        } else {
          logger.debug(
            `Device ${energyDevice.name}: consumption feature ${consumptionFeature.id} has no linked cost feature`,
          );
        }
      });
  };
  collect(
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    30,
  );
  if (pairs.length === 0) {
    collect(
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
      DAILY_DURATION_MINUTES,
    );
  }
  return pairs;
}

/**
 * @description The instant a recalculation of a contract must start from: for a tiered
 * contract, the start of the earliest accumulation period containing `startAt` (section 7.4:
 * the accumulations are recomputed from the start of the period).
 * @param {object} contract - The contract.
 * @param {object} compiled - Its compiled tariff.
 * @param {Date} startAt - Requested start.
 * @returns {Date} The effective start.
 * @example
 * getEffectiveStart(contract, compiled, new Date());
 */
function getEffectiveStart(contract, compiled, startAt) {
  if (!compiled.hasTier) {
    return startAt;
  }
  const tz = contract.timezone;
  const { date } = getLocalContext(startAt.getTime(), tz);
  const starts = compiled.tierScopes.map((scope) => {
    if (scope === 'day') {
      return getDayBounds(date, tz).startMs;
    }
    if (scope === 'month') {
      return getMonthBounds(date, tz).startMs;
    }
    return getBillingPeriodBounds(date, contract.billing_period_start_day || 1, tz).startMs;
  });
  return new Date(Math.min(startAt.getTime(), ...starts));
}

/**
 * @description Price the intervals of one contract, billing period by billing period:
 * an elapsed period is priced as closed (its demand charges are applied), the current one
 * is not (section 7.2, demand is never estimated mid-period).
 * @param {object} energyContract - The energy contract manager.
 * @param {object} contract - The contract.
 * @param {Array<object>} intervals - Sorted intervals of this contract.
 * @param {number} nowMs - Current instant.
 * @returns {Promise<object>} { costs, warnings, unpriced }.
 * @example
 * await priceByBillingPeriod(gladys.energyContract, contract, intervals, Date.now());
 */
async function priceByBillingPeriod(energyContract, contract, intervals, nowMs) {
  const groups = [];
  intervals.forEach((interval) => {
    const { date } = getLocalContext(new Date(interval.starts_at).getTime(), contract.timezone);
    const bounds = getBillingPeriodBounds(date, contract.billing_period_start_day || 1, contract.timezone);
    const last = groups[groups.length - 1];
    if (last && last.id === bounds.id) {
      last.intervals.push(interval);
    } else {
      groups.push({ id: bounds.id, endMs: bounds.endMs, intervals: [interval] });
    }
  });
  const result = { costs: [], warnings: [], unpriced: [] };
  await Promise.each(groups, async (group) => {
    const priced = await energyContract.priceContractIntervals(contract, group.intervals, {
      closed_period: group.endMs <= nowMs,
    });
    result.costs.push(...priced.costs);
    result.warnings.push(...priced.warnings);
    result.unpriced.push(...priced.unpriced);
  });
  return result;
}

/**
 * @description Calculate the energy costs from a date with the active contracts of the
 * root meters (docs/specs/energy-contracts.md, section 7): the consumption states of every
 * energy device are priced by the contract of their root meter at the interval start.
 * @param {Date} startAt - The start date.
 * @param {string} [jobId] - The job id.
 * @param {object} [options] - Options.
 * @param {Array<string>} [options.deviceIds] - Only recalculate cost for these device ids.
 * @param {Array<string>} [options.electricMeterDeviceIds] - Only the devices of these root meters.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateCostFrom(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFrom(startAt, jobId, options = {}) {
  const nowMs = Date.now();
  let energyDevices = await this.gladys.device.get({
    device_feature_category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  });
  // When a sync only touched some devices (e.g. Enedis), don't rewrite the cost
  // history of every other energy device: their consumption states are unchanged.
  if (options.deviceIds && options.deviceIds.length > 0) {
    const deviceIdsSet = new Set(options.deviceIds);
    const totalDevices = energyDevices.length;
    energyDevices = energyDevices.filter((energyDevice) => deviceIdsSet.has(energyDevice.id));
    logger.info(`Found ${totalDevices} energy devices, recalculating cost for ${energyDevices.length} of them`);
  } else {
    logger.info(`Found ${energyDevices.length} energy devices`);
  }
  const meterFilter =
    options.electricMeterDeviceIds && options.electricMeterDeviceIds.length > 0
      ? new Set(options.electricMeterDeviceIds)
      : null;
  // Contracts are per root meter and don't change during the run: fetched once per meter.
  const contractsByMeter = new Map();
  const getContracts = async (meterDeviceId) => {
    if (!contractsByMeter.has(meterDeviceId)) {
      contractsByMeter.set(
        meterDeviceId,
        await this.gladys.energyContract.get({ electric_meter_device_id: meterDeviceId }),
      );
    }
    return contractsByMeter.get(meterDeviceId);
  };
  const warningsCount = {};
  await Promise.each(energyDevices, async (energyDevice, index) => {
    try {
      const pairs = findConsumptionCostPairs(energyDevice);
      await Promise.each(pairs, async (pair) => {
        const electricMeterFeature = this.gladys.device.energySensorManager.getRootElectricMeterDevice(
          pair.consumptionFeature,
        );
        if (!electricMeterFeature) {
          logger.warn(
            `Device ${energyDevice.name}: skipping consumption feature ${pair.consumptionFeature.id} - no valid root electric meter found (broken hierarchy)`,
          );
          return;
        }
        if (meterFilter && !meterFilter.has(electricMeterFeature.device_id)) {
          return;
        }
        const contracts = await getContracts(electricMeterFeature.device_id);
        if (contracts.length === 0) {
          logger.debug(`No energy contract for meter ${electricMeterFeature.device_id}: no cost computed`);
          return;
        }
        // A tiered contract recomputes from the start of its accumulation period.
        let effectiveStart = startAt;
        contracts.forEach((contract) => {
          if (contract.pricing_mode === ENERGY_CONTRACT_PRICING_MODES.RULES) {
            effectiveStart = getEffectiveStart(
              contract,
              this.gladys.energyContract.getCompiledTariff(contract),
              effectiveStart,
            );
          }
        });
        logger.debug(
          `Destroying states from ${pair.consumptionCostFeature.selector} from ${effectiveStart.toISOString()}`,
        );
        await this.gladys.device.destroyStatesFrom(pair.consumptionCostFeature.selector, effectiveStart);
        const deviceFeatureStates = await this.gladys.device.getDeviceFeatureStates(
          pair.consumptionFeature.selector,
          effectiveStart,
          new Date(),
        );
        logger.debug(`Found ${deviceFeatureStates.length} states for device ${pair.consumptionFeature.selector}`);
        // Group the intervals by the contract active at their start (contracts are sorted
        // by valid_from DESC: the first match is the most recent one covering the date).
        const intervalsByContract = new Map();
        deviceFeatureStates.forEach((state) => {
          const startsAtMs = new Date(state.created_at).getTime() - THIRTY_MINUTES_IN_MS;
          const contract = contracts.find((c) => {
            const { date } = getLocalContext(startsAtMs, c.timezone);
            return c.valid_from <= date && (c.valid_to === null || c.valid_to >= date);
          });
          if (!contract) {
            return;
          }
          if (!intervalsByContract.has(contract.id)) {
            intervalsByContract.set(contract.id, { contract, intervals: [] });
          }
          intervalsByContract.get(contract.id).intervals.push({
            starts_at: new Date(startsAtMs).toISOString(),
            created_at: state.created_at,
            kwh: convertEnergyUnit(state.value, pair.consumptionFeature.unit, DEVICE_FEATURE_UNITS.KILOWATT_HOUR),
            duration_minutes: pair.durationMinutes,
          });
        });
        const statesToInsert = [];
        await Promise.each(Array.from(intervalsByContract.values()), async ({ contract, intervals }) => {
          const priced = await priceByBillingPeriod(this.gladys.energyContract, contract, intervals, nowMs);
          const createdAtByStart = new Map(intervals.map((i) => [i.starts_at, i.created_at]));
          priced.costs.forEach((cost) => {
            statesToInsert.push({ value: cost.cost, created_at: createdAtByStart.get(cost.starts_at) });
          });
          priced.warnings.forEach((warning) => {
            warningsCount[warning.reason] = (warningsCount[warning.reason] || 0) + 1;
          });
          if (priced.unpriced.length > 0) {
            logger.warn(
              `Contract ${contract.selector}: ${priced.unpriced.length} interval(s) left without a cost (delegated integration unavailable), retried by the next run`,
            );
          }
        });
        await this.gladys.device.saveMultipleHistoricalStates(pair.consumptionCostFeature.id, statesToInsert);
      });
    } catch (e) {
      logger.error(e);
    }
    if (jobId) {
      await this.gladys.job.updateProgress(jobId, Math.round(((index + 1) / energyDevices.length) * 100));
    }
  });
  Object.keys(warningsCount).forEach((reason) => {
    logger.warn(`Energy cost calculation: ${warningsCount[reason]} interval(s) priced by a fallback (${reason})`);
  });
  return null;
}

module.exports = {
  calculateCostFrom,
  findConsumptionCostPairs,
  getEffectiveStart,
};
