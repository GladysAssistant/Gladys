const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../utils/constants');
const { convertEnergyUnit } = require('../../utils/units');
const { getLocalContext, getDayBounds, getMonthBounds, getBillingPeriodBounds } = require('./tariff.time');

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

/**
 * @description Find the 30-minute consumption feature of a root meter device.
 * @param {string} electricMeterDeviceId - Root meter device id.
 * @returns {object|null} The feature or null.
 * @example
 * this.getMeterConsumptionFeature('…');
 */
function getMeterConsumptionFeature(electricMeterDeviceId) {
  const device = this.stateManager.get('deviceById', electricMeterDeviceId);
  if (!device) {
    return null;
  }
  return (
    device.features.find(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    ) || null
  );
}

/**
 * @description Read the stored 30-minute consumption of a root meter as engine intervals
 * (`starts_at` = state `created_at` − 30 min, `kwh` converted).
 * @param {string} electricMeterDeviceId - Root meter device id.
 * @param {Date} from - Window start (interval starts).
 * @param {Date} to - Window end.
 * @returns {Promise<Array<object>>} [{ starts_at, kwh }] sorted.
 * @example
 * await this.getMeterIntervals('…', new Date('2026-01-01'), new Date());
 */
async function getMeterIntervals(electricMeterDeviceId, from, to) {
  const feature = this.getMeterConsumptionFeature(electricMeterDeviceId);
  if (feature === null) {
    return [];
  }
  const states = await this.device.getDeviceFeatureStates(
    feature.selector,
    new Date(from.getTime() + THIRTY_MINUTES_MS),
    new Date(to.getTime() + THIRTY_MINUTES_MS),
  );
  return states.map((state) => ({
    starts_at: new Date(new Date(state.created_at).getTime() - THIRTY_MINUTES_MS).toISOString(),
    kwh: convertEnergyUnit(state.value, feature.unit, DEVICE_FEATURE_UNITS.KILOWATT_HOUR),
  }));
}

/**
 * @description Compute the kWh accumulated by a meter before an instant, per scope
 * (day, month, billing period), from its stored consumption states (section 7.1: the
 * preview and the current price pass the real `cumulative_before`).
 * @param {string} electricMeterDeviceId - Root meter device id.
 * @param {object} contract - `timezone`, `billing_period_start_day`.
 * @param {number} atMs - The instant (ms).
 * @returns {Promise<object>} { day, month, billing_period } in kWh.
 * @example
 * await this.getMeterCumulative('…', contract, Date.now());
 */
async function getMeterCumulative(electricMeterDeviceId, contract, atMs) {
  const tz = contract.timezone;
  const { date } = getLocalContext(atMs, tz);
  const bounds = {
    day: getDayBounds(date, tz).startMs,
    month: getMonthBounds(date, tz).startMs,
    billing_period: getBillingPeriodBounds(date, contract.billing_period_start_day || 1, tz).startMs,
  };
  const earliest = Math.min(bounds.day, bounds.month, bounds.billing_period);
  const intervals = await this.getMeterIntervals(electricMeterDeviceId, new Date(earliest), new Date(atMs - 1));
  const cumulative = { day: 0, month: 0, billing_period: 0 };
  intervals.forEach((interval) => {
    const ms = new Date(interval.starts_at).getTime();
    Object.keys(bounds).forEach((scope) => {
      if (ms >= bounds[scope]) {
        cumulative[scope] += interval.kwh;
      }
    });
  });
  return cumulative;
}

module.exports = { getMeterConsumptionFeature, getMeterIntervals, getMeterCumulative, THIRTY_MINUTES_MS };
