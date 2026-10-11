const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { MAX_ENERGY_PRICE_PER_KWH, MAX_ENERGY_PRICE_PER_KWH_BY_CURRENCY } = require('./constants');
const logger = require('../../utils/logger');

const COST_DECIMALS = 6;
const MAX_LABEL_LENGTH = 64;

/**
 * @description Round a cost to the engine precision.
 * @param {number} value - Amount.
 * @returns {number} Rounded amount.
 * @example
 * round(0.1234567); // 0.123457
 */
function round(value) {
  const factor = 10 ** COST_DECIMALS;
  return Math.round(value * factor) / factor;
}

/**
 * @description The bound per kWh of a delegated price in a currency (capability file,
 * section 3): 10 units by default, raised for the currencies whose unit is small.
 * @param {string} currency - ISO 4217 code of the contract.
 * @returns {number} The bound in currency units per kWh.
 * @example
 * getMaxEnergyPricePerKwh('JPY'); // 2000
 */
function getMaxEnergyPricePerKwh(currency) {
  return MAX_ENERGY_PRICE_PER_KWH_BY_CURRENCY[String(currency || '').toUpperCase()] || MAX_ENERGY_PRICE_PER_KWH;
}

/**
 * @description Normalize the costs answered by an integration to a delegated pricing
 * request (capabilities/energy-contracts.md, section 3). The payload is never trusted:
 * every requested interval must have exactly one answer, a finite cost between 0 and
 * `kwh × max_price_per_kwh`; unrequested intervals are ignored. An invalid payload fails
 * like a timeout (the intervals get no cost, the job retries).
 * @param {object} payload - `data` of the command result: { costs: [{ starts_at, cost, components?, label? }] }.
 * @param {Array<object>} requestedIntervals - The intervals sent: [{ starts_at, kwh }].
 * @param {number} [maxPricePerKwh] - Bound per kWh (10 currency units by default).
 * @returns {Map<string, object>} starts_at (ISO) → { cost, components, label }.
 * @example
 * normalizeEnergyCosts({ costs: [{ starts_at: '2026-01-12T05:00:00.000Z', cost: 0.2 }] }, intervals);
 */
function normalizeEnergyCosts(payload, requestedIntervals, maxPricePerKwh = MAX_ENERGY_PRICE_PER_KWH) {
  if (payload === null || typeof payload !== 'object' || !Array.isArray(payload.costs)) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS');
  }
  const requested = new Map(requestedIntervals.map((i) => [new Date(i.starts_at).toISOString(), i]));
  const answers = new Map();
  payload.costs.forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object') {
      throw new ExternalIntegrationUnavailableError(`EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: costs[${index}]`);
    }
    const ms = new Date(entry.starts_at).getTime();
    if (Number.isNaN(ms)) {
      throw new ExternalIntegrationUnavailableError(
        `EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: costs[${index}].starts_at`,
      );
    }
    const startsAt = new Date(ms).toISOString();
    const interval = requested.get(startsAt);
    if (interval === undefined) {
      logger.debug(`energy-contract.price: unrequested interval ${startsAt} ignored`);
      return;
    }
    if (answers.has(startsAt)) {
      throw new ExternalIntegrationUnavailableError(`EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: duplicate ${startsAt}`);
    }
    const bound = Math.max(0, Number(interval.kwh) || 0) * maxPricePerKwh;
    if (typeof entry.cost !== 'number' || !Number.isFinite(entry.cost) || entry.cost < 0 || entry.cost > bound) {
      throw new ExternalIntegrationUnavailableError(
        `EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: cost of ${startsAt} must be a number between 0 and ${bound}`,
      );
    }
    const components = {};
    if (entry.components !== undefined) {
      if (entry.components === null || typeof entry.components !== 'object' || Array.isArray(entry.components)) {
        throw new ExternalIntegrationUnavailableError(
          `EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: components of ${startsAt}`,
        );
      }
      Object.keys(entry.components).forEach((key) => {
        const amount = entry.components[key];
        if (!/^[a-z0-9_-]{1,32}$/.test(key) || typeof amount !== 'number' || !Number.isFinite(amount)) {
          throw new ExternalIntegrationUnavailableError(
            `EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: component "${key}" of ${startsAt}`,
          );
        }
        components[key] = round(amount);
      });
    }
    if (Object.keys(components).length === 0) {
      components.energy = round(entry.cost);
    }
    const label =
      typeof entry.label === 'string' && entry.label.length > 0 ? entry.label.slice(0, MAX_LABEL_LENGTH) : undefined;
    answers.set(startsAt, { cost: round(entry.cost), components, label });
  });
  requested.forEach((interval, startsAt) => {
    if (!answers.has(startsAt)) {
      throw new ExternalIntegrationUnavailableError(`EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS: missing ${startsAt}`);
    }
  });
  return answers;
}

/**
 * @description Normalize the answer to `energy-contract.current`: { price, valid_until, next_price }.
 * @param {object} payload - `data` of the command result.
 * @param {number} [maxPricePerKwh] - Bound per kWh.
 * @returns {object} { price, unit, label, valid_until, next_price, next_label }.
 * @example
 * normalizeEnergyCurrent({ price: 0.18, valid_until: '2026-01-12T06:00:00Z', next_price: 0.25 });
 */
function normalizeEnergyCurrent(payload, maxPricePerKwh = MAX_ENERGY_PRICE_PER_KWH) {
  if (payload === null || typeof payload !== 'object') {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_ENERGY_CURRENT');
  }
  const price = (value, field) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < -maxPricePerKwh || value > maxPricePerKwh) {
      throw new ExternalIntegrationUnavailableError(`EXTERNAL_INTEGRATION_INVALID_ENERGY_CURRENT: ${field}`);
    }
    return round(value);
  };
  let validUntil = null;
  if (payload.valid_until !== undefined && payload.valid_until !== null) {
    const ms = new Date(payload.valid_until).getTime();
    if (Number.isNaN(ms)) {
      throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_ENERGY_CURRENT: valid_until');
    }
    validUntil = new Date(ms).toISOString();
  }
  const label = (value) =>
    typeof value === 'string' && value.length > 0 ? value.slice(0, MAX_LABEL_LENGTH) : undefined;
  return {
    price: price(payload.price, 'price'),
    unit: 'kWh',
    label: label(payload.label),
    valid_until: validUntil,
    next_price: price(payload.next_price, 'next_price'),
    next_label: label(payload.next_label),
  };
}

module.exports = {
  getMaxEnergyPricePerKwh,
  normalizeEnergyCosts,
  normalizeEnergyCurrent,
};
