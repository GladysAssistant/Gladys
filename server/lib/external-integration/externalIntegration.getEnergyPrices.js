const { BadParameters, ForbiddenError, NotFoundError, TooManyRequests } = require('../../utils/coreErrors');
const {
  ENERGY_PRICE_MAX_WINDOW_MS,
  ENERGY_PRICE_PAST_WINDOW_MS,
  ENERGY_PRICE_FUTURE_WINDOW_MS,
  MAX_ENERGY_PRICE_READS_PER_MINUTE,
} = require('./constants');

// an ISO 8601 date-time with an explicit offset: a value without one would be read in the
// timezone of the Gladys host, and Date.parse alone accepts loose formats ("1", "2026")
const ISO_INSTANT_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * @description Parse one bound of the window of GET /energy/price: an ISO 8601 date-time with
 * an explicit `Z` or `±HH:MM` offset.
 * @param {any} value - The query value.
 * @param {string} name - `from` or `to`, for the error message.
 * @returns {number} Milliseconds since the epoch.
 * @example
 * parseInstant('2026-01-12T00:00:00Z', 'from');
 */
function parseInstant(value, name) {
  const ms = typeof value === 'string' && ISO_INSTANT_REGEX.test(value) ? Date.parse(value) : NaN;
  if (Number.isNaN(ms)) {
    throw new BadParameters(`${name}: must be an ISO date`);
  }
  return ms;
}

/**
 * @description Host API `GET /api/integration/v1/energy/price` (capabilities/energy-prices.md):
 * the energy price per kWh that applies to one of the integration's own devices over a window,
 * read on the active contract of the device's root electric meter. The tariff is the user's
 * personal data: only an integration declaring `energy_prices: true` in its manifest (shown on
 * the install screen) may read it, 403 otherwise. Only prices go out: never the meter, its
 * consumption, the contract name nor its inputs. Rate limited per integration.
 * @param {object} service - The calling integration.
 * @param {object} query - `device_external_id`, `from`, `to` (ISO dates).
 * @returns {Promise<object>} { currency, slots: [{ starts_at, ends_at, price, label? }] }.
 * @example
 * await gladys.externalIntegration.getEnergyPrices(service, { device_external_id, from, to });
 */
async function getEnergyPrices(service, query = {}) {
  if (!service.manifest || service.manifest.energy_prices !== true) {
    throw new ForbiddenError('energy_prices: reading the energy prices is not declared in the manifest');
  }
  // fixed one-minute window, in memory per integration (the POST /state mechanics)
  const now = Date.now();
  let rateLimit = this.energyPriceRateLimits.get(service.id);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + 60 * 1000 };
    this.energyPriceRateLimits.set(service.id, rateLimit);
  }
  if (rateLimit.count + 1 > MAX_ENERGY_PRICE_READS_PER_MINUTE) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${MAX_ENERGY_PRICE_READS_PER_MINUTE} energy price reads per minute`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += 1;
  const { device_external_id: deviceExternalId } = query;
  if (typeof deviceExternalId !== 'string' || deviceExternalId.length === 0) {
    throw new BadParameters('device_external_id: must be a non-empty string');
  }
  const from = parseInstant(query.from, 'from');
  const to = parseInstant(query.to, 'to');
  if (to <= from) {
    throw new BadParameters('to: must be after from');
  }
  if (to - from > ENERGY_PRICE_MAX_WINDOW_MS) {
    throw new BadParameters('to: the window is at most 7 days');
  }
  if (from < now - ENERGY_PRICE_PAST_WINDOW_MS) {
    throw new BadParameters('from: must be at most one year ago');
  }
  if (to > now + ENERGY_PRICE_FUTURE_WINDOW_MS) {
    throw new BadParameters('to: must be at most 48 hours ahead');
  }
  const device = this.stateManager.get('deviceByExternalId', deviceExternalId);
  if (device === null || device.service_id !== service.id) {
    // a device of another integration stays invisible: same 404 as unknown
    throw new NotFoundError('DEVICE_NOT_FOUND');
  }
  const meterDeviceId = await this.energyContract.getDeviceElectricMeterId(device);
  if (meterDeviceId === null) {
    throw new NotFoundError('DEVICE_NOT_ON_ELECTRIC_METER');
  }
  return this.energyContract.getMeterPrices(meterDeviceId, { from, to });
}

module.exports = {
  getEnergyPrices,
};
