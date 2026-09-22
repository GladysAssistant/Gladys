const { TARIFF_COMPONENT_KINDS, COST_DECIMALS } = require('./tariff.constants');
const { getLocalContext } = require('./tariff.time');
const { matchesConditions } = require('./tariff.conditions');
const { resolvePrice } = require('./tariff.priceIntervals');
const { createCalendarLookup } = require('./calendar.lookup');

const SLOT_MS = 30 * 60 * 1000;
const EMPTY_LOOKUP = createCalendarLookup();

/**
 * @description The unit price (per kWh) a contract charges at an instant: the sum of the
 * consumption components' matching rule prices (a tier rule matches when the next kWh
 * falls in its tier), plus the taxes that apply to them. Fixed and demand components are
 * not per-kWh and are left out.
 * @param {object} compiled - Compiled tariff.
 * @param {object} contract - The contract, with its timezone.
 * @param {number} ms - Instant, milliseconds since the epoch.
 * @param {object} lookup - Calendar lookup.
 * @param {object} cumulative - The kWh accumulated so far per scope (for tier rules).
 * @returns {object} The unit price { price, label }; `price` is null when a calendar value is missing.
 * @example
 * getUnitPriceAt(compiled, { timezone: 'Europe/Paris' }, Date.now(), lookup, { day: 0, month: 0, billing_period: 0 });
 */
function getUnitPriceAt(compiled, contract, ms, lookup, cumulative) {
  const local = getLocalContext(ms, contract.timezone);
  const getCalendarValue = (key) => lookup.get(key, ms, local, contract.timezone);
  const context = { local, getCalendarValue, maxPowerKw: 0 };
  const byComponent = {};
  let label;
  let price = 0;
  let missing = false;
  compiled.components.forEach((component) => {
    if (component.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION) {
      const rule = component.rules.find((r) => {
        if (!matchesConditions(r.when, context)) {
          return false;
        }
        const tier = r.when === undefined ? undefined : r.when.tier;
        return (
          tier === undefined ||
          (cumulative[tier.cumulative] >= tier.from_kwh && cumulative[tier.cumulative] < tier.to_kwh)
        );
      });
      // a consumption component always has a fallback or a catch-all last rule (validated)
      const spec = rule || component.fallback;
      const unit = resolvePrice(spec, getCalendarValue);
      if (unit === undefined) {
        missing = true;
        return;
      }
      byComponent[component.key] = unit;
      price += unit;
      if (spec.label !== undefined) {
        label = spec.label;
      }
    } else if (component.kind === TARIFF_COMPONENT_KINDS.TAX) {
      const base = component.applies_to.reduce((sum, key) => sum + (byComponent[key] || 0), 0);
      const tax = (base * component.rate) / 100;
      byComponent[component.key] = tax;
      price += tax;
    }
  });
  if (missing) {
    return { price: null, label: undefined };
  }
  const factor = 10 ** COST_DECIMALS;
  return { price: Math.round(price * factor) / factor, label };
}

/**
 * @description Current unit price of a contract and its next change, for the price widget,
 * the assistant and the scene trigger: the price at `at`, then a scan of the following
 * 30-minute slots until the price or the rule label changes.
 * @param {object} compiled - Compiled tariff.
 * @param {object} contract - The contract, with its timezone.
 * @param {object} [options] - Options: `at` (Date or timestamp, now by default), `calendars` (lookup),
 * `cumulative` ({ day, month, billing_period } for tier rules), `horizon_hours` (48 by default).
 * @returns {object} The current price { price, label, valid_until, next_price, next_label };
 * `valid_until` is null when the price does not change within the horizon.
 * @example
 * const current = getCurrentPrice(compiled, { timezone: 'Europe/Paris' }, { calendars: lookup });
 */
function getCurrentPrice(compiled, contract, options = {}) {
  const at = options.at === undefined ? Date.now() : new Date(options.at).getTime();
  const lookup = options.calendars || EMPTY_LOOKUP;
  const cumulative = { day: 0, month: 0, billing_period: 0, ...(options.cumulative || {}) };
  const horizonMs = (options.horizon_hours || 48) * 60 * 60 * 1000;
  const current = getUnitPriceAt(compiled, contract, at, lookup, cumulative);
  const result = {
    price: current.price,
    label: current.label,
    valid_until: null,
    next_price: null,
    next_label: undefined,
  };
  // Next change: scan the slot boundaries after `at`.
  let slot = Math.floor(at / SLOT_MS) * SLOT_MS + SLOT_MS;
  while (slot - at <= horizonMs) {
    const next = getUnitPriceAt(compiled, contract, slot, lookup, cumulative);
    if (next.price !== current.price || next.label !== current.label) {
      result.valid_until = new Date(slot).toISOString();
      result.next_price = next.price;
      result.next_label = next.label;
      break;
    }
    slot += SLOT_MS;
  }
  return result;
}

module.exports = {
  getUnitPriceAt,
  getCurrentPrice,
};
