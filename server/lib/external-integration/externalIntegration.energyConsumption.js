const { BadParameters, NotFoundError } = require('../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { convertEnergyUnit } = require('../../utils/units');
const { DATE_REGEX } = require('../energy-contract/tariff.constants');
const { localToUtcMs, getLocalContext, addDays, MS_PER_MINUTE } = require('../energy-contract/tariff.time');
const { ENERGY_INDEX_FEATURE_TYPES } = require('../../services/energy-monitoring/utils/constants');
const { isConsumptionFeature } = require('../../services/energy-monitoring/utils/addEnergyFeatures');
const { MAX_ENERGY_CONSUMPTION_INTERVALS_PER_CALL, ENERGY_CONSUMPTION_PAST_WINDOW_MS } = require('./constants');
const logger = require('../../utils/logger');

const THIRTY_MINUTES_MS = 30 * MS_PER_MINUTE;

/**
 * @description Resolve one published interval into the state to store: the instant the core
 * stamps a consumption state with (the END of a 30-minute interval, the START of a daily one,
 * core spec section 7.1) and its kWh. The interval must be aligned on the Gladys clock (a
 * 30-minute slot, or a local midnight for a daily feature), elapsed, and at most 5 years old.
 * @param {object} interval - { starts_at | date, kwh }.
 * @param {number} index - Index in the batch (for the error message).
 * @param {object} context - The batch context.
 * @param {boolean} context.isDaily - True for a daily consumption feature.
 * @param {string} context.timezone - The Gladys timezone.
 * @param {number} context.now - The current instant (ms).
 * @returns {object} { created_at (ms), kwh }.
 * @example
 * resolveInterval({ starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 }, 0, { isDaily: false, timezone: 'UTC', now });
 */
function resolveInterval(interval, index, { isDaily, timezone, now }) {
  if (interval === null || typeof interval !== 'object') {
    throw new BadParameters(`intervals[${index}]: must be an object`);
  }
  if (typeof interval.kwh !== 'number' || !Number.isFinite(interval.kwh) || interval.kwh < 0) {
    throw new BadParameters(`intervals[${index}].kwh: must be a finite positive number`);
  }
  let startMs;
  if (interval.date !== undefined) {
    if (typeof interval.date !== 'string' || !DATE_REGEX.test(interval.date)) {
      throw new BadParameters(`intervals[${index}].date: must be a YYYY-MM-DD date`);
    }
    if (!isDaily) {
      throw new BadParameters(`intervals[${index}].date: a 30-minute consumption takes starts_at`);
    }
    startMs = localToUtcMs(interval.date, timezone);
  } else {
    startMs = new Date(interval.starts_at).getTime();
    if (Number.isNaN(startMs)) {
      throw new BadParameters(`intervals[${index}].starts_at: must be an ISO date`);
    }
    const local = getLocalContext(startMs, timezone);
    if (isDaily && (local.minutes !== 0 || startMs % MS_PER_MINUTE !== 0)) {
      throw new BadParameters(`intervals[${index}].starts_at: must be a local midnight of ${timezone}`);
    }
    if (!isDaily && (local.minutes % 30 !== 0 || startMs % MS_PER_MINUTE !== 0)) {
      throw new BadParameters(`intervals[${index}].starts_at: must be aligned on a 30-minute slot of ${timezone}`);
    }
  }
  // the end of the interval: the next local midnight for a day (23 or 25 hours on a clock change)
  const endMs = isDaily
    ? localToUtcMs(addDays(getLocalContext(startMs, timezone).date, 1), timezone)
    : startMs + THIRTY_MINUTES_MS;
  if (startMs < now - ENERGY_CONSUMPTION_PAST_WINDOW_MS) {
    throw new BadParameters(`intervals[${index}]: starts_at must be at most 5 years ago`);
  }
  if (endMs > now) {
    throw new BadParameters(`intervals[${index}]: the interval must be elapsed`);
  }
  return { created_at: isDaily ? startMs : endMs, kwh: interval.kwh };
}

/**
 * @description Host API `POST /api/integration/v1/energy/consumption`: publish dated
 * consumption intervals on a 30-minute or daily consumption feature the integration feeds
 * itself (a supplier whose data arrives a day late, like Hydro-Québec or Enedis, cannot go
 * through the live index pipeline). The states are upserted by instant (a republication or a
 * correction never duplicates), and the costs of the feature's root meter are recomputed from
 * the earliest interval whose value changed, through the bounded meter recalculation.
 * @param {object} service - The calling integration.
 * @param {object} body - { device_feature_external_id, intervals: [{ starts_at | date, kwh }] }.
 * @returns {Promise<object>} { count, changed_from }.
 * @example
 * await gladys.externalIntegration.publishEnergyConsumption(service, { device_feature_external_id, intervals });
 */
async function publishEnergyConsumption(service, body) {
  if (body === null || typeof body !== 'object' || typeof body.device_feature_external_id !== 'string') {
    throw new BadParameters('device_feature_external_id: must be a string');
  }
  const externalIdPrefix = `ext:${service.selector}:`;
  if (!body.device_feature_external_id.startsWith(externalIdPrefix)) {
    throw new BadParameters(`device_feature_external_id: must start with "${externalIdPrefix}"`);
  }
  const feature = this.stateManager.get('deviceFeatureByExternalId', body.device_feature_external_id);
  if (feature === null) {
    throw new NotFoundError(`feature "${body.device_feature_external_id}" not found: the device is not created`);
  }
  if (!isConsumptionFeature(feature)) {
    throw new BadParameters('device_feature_external_id: must be a 30-minute or daily consumption feature');
  }
  // a consumption hanging off a cumulative index is computed by the core from the index deltas:
  // feeding it too would mix the two pipelines on the same states
  const parent = this.stateManager.get('deviceFeatureById', feature.energy_parent_id);
  if (
    parent !== null &&
    ENERGY_INDEX_FEATURE_TYPES[parent.category] &&
    ENERGY_INDEX_FEATURE_TYPES[parent.category].includes(parent.type)
  ) {
    throw new BadParameters(
      'device_feature_external_id: this consumption is derived from a cumulative index by the core, publish the index states instead',
    );
  }
  if (!Array.isArray(body.intervals) || body.intervals.length === 0) {
    throw new BadParameters('intervals: must be a non-empty array');
  }
  if (body.intervals.length > MAX_ENERGY_CONSUMPTION_INTERVALS_PER_CALL) {
    throw new BadParameters(`intervals: at most ${MAX_ENERGY_CONSUMPTION_INTERVALS_PER_CALL} intervals per call`);
  }
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
  const context = {
    isDaily: feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
    timezone,
    now: Date.now(),
  };
  // the last value given for an instant wins, in the batch like in the database
  const kwhByInstant = new Map();
  body.intervals.forEach((interval, index) => {
    const resolved = resolveInterval(interval, index, context);
    kwhByInstant.set(resolved.created_at, resolved.kwh);
  });
  const instants = Array.from(kwhByInstant.keys()).sort((a, b) => a - b);
  const existingStates = await this.device.getDeviceFeatureStates(
    feature.selector,
    new Date(instants[0]),
    new Date(instants[instants.length - 1]),
  );
  const existingByInstant = new Map(existingStates.map((state) => [new Date(state.created_at).getTime(), state.value]));
  let changedFrom = null;
  // Sequential on purpose: one upsert per state, the writes are serialized anyway
  // eslint-disable-next-line no-restricted-syntax
  for (const instant of instants) {
    const value = convertEnergyUnit(kwhByInstant.get(instant), DEVICE_FEATURE_UNITS.KILOWATT_HOUR, feature.unit);
    if (existingByInstant.get(instant) !== value) {
      // eslint-disable-next-line no-await-in-loop
      await this.device.saveHistoricalState(feature, value, new Date(instant));
      if (changedFrom === null) {
        changedFrom = instant;
      }
    }
  }
  const result = { count: instants.length, changed_from: changedFrom === null ? null : new Date(changedFrom) };
  if (changedFrom === null) {
    return result;
  }
  const rootMeterFeature = this.device.energySensorManager.getRootElectricMeterDevice(feature);
  if (rootMeterFeature === null) {
    logger.warn(
      `Integration ${service.selector}: consumption ${feature.external_id} has no valid root meter, costs not recomputed`,
    );
    return result;
  }
  await this.energyContract.requestMeterRecalculation(rootMeterFeature.device_id, result.changed_from);
  return result;
}

module.exports = {
  publishEnergyConsumption,
  resolveInterval,
};
