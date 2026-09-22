const { ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const { getCurrentPrice } = require('./tariff.currentPrice');
const { getBillingPeriodBounds, getLocalContext } = require('./tariff.time');
const { THIRTY_MINUTES_MS } = require('./meter.intervals');

const CURRENT_CACHE_TTL_MS = 5 * 60 * 1000;
const HORIZON_HOURS = 48;

/**
 * @description Current unit price, current tier label and next change of a contract
 * (section 7.7 and 8.1, `GET /energy_contract/:selector/current`): computed with the real
 * accumulations of the meter and the peak of its last interval; in delegated mode relayed
 * to the integration with the same state and cached 5 minutes.
 * @param {string} selector - Contract selector.
 * @param {object} [options] - `at` (instant, now by default).
 * @returns {Promise<object>} { price, currency, unit, label, valid_until, next_price, next_label, contract }.
 * @example
 * await getCurrent('edf-tempo-9-kva');
 */
async function getCurrent(selector, options = {}) {
  const contract = await this.getBySelector(selector);
  const at = options.at === undefined ? Date.now() : new Date(options.at).getTime();
  const delegated = contract.pricing_mode === ENERGY_CONTRACT_PRICING_MODES.DELEGATED;
  const cached = delegated ? this.currentPriceCache.get(contract.id) : undefined;
  if (cached && cached.expires_at > Date.now()) {
    return cached.value;
  }
  const cumulative = await this.getMeterCumulative(contract.electric_meter_device_id, contract, at);
  const lastIntervals = await this.getMeterIntervals(
    contract.electric_meter_device_id,
    new Date(at - 2 * THIRTY_MINUTES_MS),
    new Date(at),
  );
  const last = lastIntervals[lastIntervals.length - 1];
  const maxPowerKw = last ? last.kwh * 2 : 0;
  const base = {
    currency: contract.currency,
    unit: 'kWh',
    contract: { id: contract.id, selector, name: contract.name },
  };
  let value;
  if (delegated) {
    const { date } = getLocalContext(at, contract.timezone);
    const bounds = getBillingPeriodBounds(date, contract.billing_period_start_day || 1, contract.timezone);
    const answer = await this.externalIntegration.getEnergyContractCurrent(contract, {
      billing_period: {
        starts_at: new Date(bounds.startMs).toISOString(),
        ends_at: new Date(bounds.endMs).toISOString(),
      },
      cumulative,
      max_power_kw: maxPowerKw,
    });
    value = { ...base, ...answer, cumulative };
    this.currentPriceCache.set(contract.id, { expires_at: Date.now() + CURRENT_CACHE_TTL_MS, value });
  } else {
    const compiled = this.getCompiledTariff(contract);
    const calendars = await this.loadCalendarLookup(
      compiled.calendars,
      at - THIRTY_MINUTES_MS,
      at + HORIZON_HOURS * 60 * 60 * 1000,
      contract.timezone,
    );
    const current = getCurrentPrice(compiled, contract, {
      at,
      calendars,
      cumulative,
      max_power_kw: maxPowerKw,
      horizon_hours: HORIZON_HOURS,
    });
    value = { ...base, ...current, cumulative };
  }
  return value;
}

module.exports = { getCurrent, CURRENT_CACHE_TTL_MS };
