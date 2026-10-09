const { ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const { getCurrentPrice } = require('./tariff.currentPrice');
const { getBillingPeriodBounds, getLocalContext } = require('./tariff.time');
const { THIRTY_MINUTES_MS } = require('./meter.intervals');

const CURRENT_CACHE_TTL_MS = 5 * 60 * 1000;
const HORIZON_HOURS = 48;
// a rules contract's live price is cached until the end of its 15-minute slot on the contract's
// local clock: the price, the label and the next change can only move at a slot boundary, or when
// the stored consumption, a calendar or the contract change (the cache is cleared then)
const RULES_CACHE_SLOT_MINUTES = 15;

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
  const version = new Date(contract.updated_at).getTime();
  // the delegated answer is cached whatever the instant asked, a rules price only for a live call
  const cacheable = delegated || options.at === undefined;
  const cached = cacheable ? this.currentPriceCache.get(contract.id) : undefined;
  if (cached && cached.version === version && cached.expires_at > Date.now()) {
    return cached.value;
  }
  const compiled = delegated ? undefined : this.getCompiledTariff(contract);
  const cumulative = await this.getMeterCumulative(contract.electric_meter_device_id, contract, at, { compiled });
  // the filtered counters of the `counts_when` tiers stay internal to the engine
  const { counters, ...plainCumulative } = cumulative;
  const lastIntervals = await this.getMeterIntervals(
    contract.electric_meter_device_id,
    new Date(at - 2 * THIRTY_MINUTES_MS),
    new Date(at),
  );
  const last = lastIntervals[lastIntervals.length - 1];
  let maxPowerKw = last ? last.kwh * 2 : 0;
  if (last) {
    // the meter's historized power feature gives the real peak of the last interval
    const peaks = await this.getMeterPowerPeaks(
      contract.electric_meter_device_id,
      new Date(last.starts_at),
      new Date(new Date(last.starts_at).getTime() + THIRTY_MINUTES_MS),
      contract.timezone,
    );
    const peak = peaks.get(new Date(last.starts_at).getTime());
    if (peak !== undefined) {
      maxPowerKw = peak;
    }
  }
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
      cumulative: plainCumulative,
      max_power_kw: maxPowerKw,
    });
    value = { ...base, ...answer, cumulative: plainCumulative };
    this.currentPriceCache.set(contract.id, { version, expires_at: Date.now() + CURRENT_CACHE_TTL_MS, value });
  } else {
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
    value = { ...base, ...current, cumulative: plainCumulative };
    if (cacheable) {
      const { minutes } = getLocalContext(at, contract.timezone);
      const slotStartMs = at - (minutes % RULES_CACHE_SLOT_MINUTES) * 60 * 1000 - (at % (60 * 1000));
      const expiresAt = slotStartMs + RULES_CACHE_SLOT_MINUTES * 60 * 1000;
      this.currentPriceCache.set(contract.id, { version, expires_at: expiresAt, value });
    }
  }
  return value;
}

/**
 * @description Forget the cached current prices: called when what they read changes (a cost
 * run stored new consumption costs, a calendar published new values).
 * @example
 * this.clearCurrentPriceCache();
 */
function clearCurrentPriceCache() {
  this.currentPriceCache.clear();
}

module.exports = { getCurrent, clearCurrentPriceCache, CURRENT_CACHE_TTL_MS };
