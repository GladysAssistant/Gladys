const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { ENERGY_CONTRACT_DIRECTIONS, ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const {
  TARIFF_COMPONENT_KINDS,
  TARIFF_CUMULATIVE_SCOPES,
  DEFAULT_INTERVAL_DURATION_MINUTES,
} = require('./tariff.constants');
const { getLocalContext, getPeriodIds, MS_PER_MINUTE } = require('./tariff.time');
const { getUnitPriceAt } = require('./tariff.currentPrice');
const { getEvaluationSlotMinutes } = require('./tariff.priceIntervals');
const { createAccumulation, toLocalDate } = require('./tariff.tier');

const SCOPES = Object.values(TARIFF_CUMULATIVE_SCOPES);

/**
 * @description Find the contract active at an instant among the contracts of a meter: the one
 * whose validity contains the local date of the instant in its own timezone (the contract of
 * an interval is the active one at the interval start, section 7).
 * @param {Array<object>} contracts - The consumption contracts of the meter.
 * @param {number} ms - The instant.
 * @returns {object|undefined} The contract, undefined when none is active.
 * @example
 * findActiveContract(contracts, Date.now());
 */
function findActiveContract(contracts, ms) {
  return contracts.find((contract) => {
    const { date } = getLocalContext(ms, contract.timezone);
    const validTo = toLocalDate(contract.valid_to, contract.timezone);
    return toLocalDate(contract.valid_from, contract.timezone) <= date && (validTo === undefined || validTo >= date);
  });
}

/**
 * @description Tell whether a compiled tariff has a tier rule: its unit price then depends on the
 * kWh accumulated before the instant.
 * @param {object} compiled - Compiled tariff.
 * @returns {boolean} True when a consumption rule reads a tier.
 * @example
 * hasTierRule(compiled);
 */
function hasTierRule(compiled) {
  return compiled.components.some(
    (component) =>
      component.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION &&
      component.rules.some((rule) => rule.when !== undefined && rule.when.tier !== undefined),
  );
}

/**
 * @description Prepare the pricing of the slots of one contract, from the first slot it prices:
 * its compiled tariff, the calendars of the rest of the window, its slot length and, for a tiered
 * tariff, the real accumulations of the meter at that slot and its stored consumption up to now
 * (the slots are priced in order, each one with the kWh accumulated before it). A delegated
 * contract is only priceable at the current instant, through its current price: it is asked
 * only when the contract is the active one now and the window has not ended.
 * @param {string} electricMeterDeviceId - The meter device id.
 * @param {object} contract - The contract.
 * @param {number} startMs - Start of its first slot in the window.
 * @param {object} context - The window and the current instant.
 * @param {number} context.toMs - End of the window.
 * @param {number} context.now - The current instant.
 * @param {object} [context.activeNow] - The contract active now, if any.
 * @returns {Promise<object>} The pricing state of the contract.
 * @example
 * await prepareContractPricing.call(energyContract, meterId, contract, startMs, { toMs, now, activeNow });
 */
async function prepareContractPricing(electricMeterDeviceId, contract, startMs, { toMs, now, activeNow }) {
  if (contract.pricing_mode === ENERGY_CONTRACT_PRICING_MODES.DELEGATED) {
    let current = null;
    if (contract === activeNow && now < toMs) {
      try {
        current = await this.getCurrent(contract.selector);
      } catch (e) {
        logger.warn(`Energy price: the current price of contract ${contract.selector} is unknown: ${e.message}`);
      }
    }
    return { contract, slotMinutes: DEFAULT_INTERVAL_DURATION_MINUTES, current };
  }
  const compiled = this.getCompiledTariff(contract);
  const lookup = await this.loadCalendarLookup(compiled.calendars, startMs, toMs, contract.timezone);
  const state = {
    contract,
    compiled,
    lookup,
    slotMinutes: getEvaluationSlotMinutes(compiled, lookup),
    tiered: hasTierRule(compiled),
    accumulation: createAccumulation(compiled),
    periodIds: null,
    kwhByIntervalStart: new Map(),
  };
  if (state.tiered) {
    const cumulative = await this.getMeterCumulative(electricMeterDeviceId, contract, startMs, { compiled });
    state.accumulation = createAccumulation(compiled, cumulative);
    if (startMs < now) {
      const intervals = await this.getMeterIntervals(electricMeterDeviceId, new Date(startMs), new Date(now));
      intervals.forEach((interval) => {
        state.kwhByIntervalStart.set(new Date(interval.starts_at).getTime(), interval.kwh);
      });
    }
  }
  return state;
}

/**
 * @description The energy price of one slot of a `rules` contract: the unit price per kWh of its
 * consumption components and their taxes (getUnitPriceAt, the engine of the current price), with
 * the real accumulations of a tiered tariff, advanced by the stored consumption of the slot.
 * The power threshold rules are evaluated at 0 kW (no peak is known for a slot of the window).
 * @param {object} state - The pricing state of the contract (prepareContractPricing).
 * @param {number} startMs - Start of the slot.
 * @returns {object} The unit price { price, label }.
 * @example
 * priceRulesSlot(state, startMs);
 */
function priceRulesSlot(state, startMs) {
  const { contract, compiled, lookup, accumulation } = state;
  const tz = contract.timezone;
  const local = getLocalContext(startMs, tz);
  if (!state.tiered) {
    return getUnitPriceAt(compiled, contract, startMs, lookup, accumulation.state, 0);
  }
  // the accumulations restart with their day, month or billing period, as in the engine
  const periodIds = getPeriodIds(local.date, contract.billing_period_start_day, tz);
  SCOPES.forEach((scope) => {
    if (state.periodIds !== null && state.periodIds[scope] !== periodIds[scope]) {
      accumulation.reset(scope);
    }
  });
  state.periodIds = periodIds;
  const unit = getUnitPriceAt(compiled, contract, startMs, lookup, accumulation.state, 0);
  // the stored consumption is per 30-minute interval of the local clock: a 15-minute slot holds half of it
  const intervalStartMs = startMs - (local.minutes % DEFAULT_INTERVAL_DURATION_MINUTES) * MS_PER_MINUTE;
  const kwh =
    ((state.kwhByIntervalStart.get(intervalStartMs) || 0) * state.slotMinutes) / DEFAULT_INTERVAL_DURATION_MINUTES;
  accumulation.add({ kwh }, { local, getCalendarValue: (key) => lookup.get(key, startMs, local, tz), maxPowerKw: 0 });
  return unit;
}

/**
 * @description The energy price per kWh that applies to an electric meter over a window
 * (capabilities/energy-prices.md): one slot per 30 minutes of the local clock of the active
 * contract (15 minutes when its tariff reads a `fifteen_minutes` calendar), each priced by the
 * contract active at its start, so a contract change inside the window is followed. Energy only:
 * the consumption components and the taxes applying to them, never the fixed or demand charges.
 * `price` is null when it is unknown: no active contract, a calendar price missing with no
 * fallback value, a contract in another currency than the meter's latest one, or a delegated
 * contract outside its current slot (a delegated contract is only priced by its integration at
 * the current instant, and keeps that price until its `valid_until`).
 * @param {string} electricMeterDeviceId - The meter device id.
 * @param {object} window - The window, `from` before `to`.
 * @param {number} window.from - Start of the window (milliseconds since the epoch).
 * @param {number} window.to - End of the window (milliseconds since the epoch).
 * @returns {Promise<object>} { currency, slots: [{ starts_at, ends_at, price, label? }] }.
 * @example
 * await energyContract.getMeterPrices(meterId, { from: Date.now(), to: Date.now() + 86400000 });
 */
async function getMeterPrices(electricMeterDeviceId, { from, to }) {
  const contracts = (await this.get({ electric_meter_device_id: electricMeterDeviceId })).filter(
    (contract) => contract.direction === ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION,
  );
  if (contracts.length === 0) {
    throw new NotFoundError('ELECTRIC_METER_HAS_NO_CONTRACT');
  }
  // most recent first: the latest contract gives the currency, and the clock of the slots no contract covers
  const latest = contracts[0];
  const now = Date.now();
  const activeNow = findActiveContract(contracts, now);
  const states = new Map();
  const slots = [];
  let cursor = from;
  while (cursor < to) {
    const contract = findActiveContract(contracts, cursor);
    let state;
    if (contract !== undefined) {
      state = states.get(contract.id);
      if (state === undefined) {
        // the slots of a contract are contiguous: its pricing starts at its first slot
        const local = getLocalContext(cursor, contract.timezone);
        // eslint-disable-next-line no-await-in-loop
        state = await prepareContractPricing.call(
          this,
          electricMeterDeviceId,
          contract,
          cursor - (local.minutes % DEFAULT_INTERVAL_DURATION_MINUTES) * MS_PER_MINUTE - (cursor % MS_PER_MINUTE),
          { toMs: to, now, activeNow },
        );
        states.set(contract.id, state);
      }
    }
    const slotMinutes = state === undefined ? DEFAULT_INTERVAL_DURATION_MINUTES : state.slotMinutes;
    const { minutes } = getLocalContext(cursor, (contract || latest).timezone);
    const startMs = cursor - (minutes % slotMinutes) * MS_PER_MINUTE - (cursor % MS_PER_MINUTE);
    const endMs = startMs + slotMinutes * MS_PER_MINUTE;
    // no contract, or one in another currency (nothing the caller could add up): an unknown price
    const priceable = state !== undefined && contract.currency === latest.currency;
    let unit = { price: null, label: undefined };
    if (priceable && contract.pricing_mode === ENERGY_CONTRACT_PRICING_MODES.DELEGATED) {
      const { current } = state;
      const validUntilMs = current === null || current.valid_until === null ? null : Date.parse(current.valid_until);
      const isCurrentSlot = startMs <= now && now < endMs;
      if (current !== null && (isCurrentSlot || (startMs > now && validUntilMs !== null && endMs <= validUntilMs))) {
        unit = { price: current.price, label: undefined };
      }
    } else if (priceable) {
      unit = priceRulesSlot(state, startMs);
    }
    const slot = {
      starts_at: new Date(startMs).toISOString(),
      ends_at: new Date(endMs).toISOString(),
      price: unit.price,
    };
    if (unit.price !== null && unit.label !== undefined) {
      slot.label = unit.label;
    }
    slots.push(slot);
    cursor = endMs;
  }
  return { currency: latest.currency, slots };
}

module.exports = { getMeterPrices, prepareContractPricing, priceRulesSlot, findActiveContract, hasTierRule };
