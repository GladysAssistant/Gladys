const { compileTariff } = require('./tariff.compile');
const { priceIntervals, roundCost } = require('./tariff.priceIntervals');
const { getLocalContext, getDayBounds, localToUtcMs } = require('./tariff.time');
const { TARIFF_COMPONENT_KINDS } = require('./tariff.constants');

const MS_PER_MINUTE = 60 * 1000;
// only the fixed components (and the taxes on them) are charged here
const DISPLAY_EXCLUDED_KINDS = [TARIFF_COMPONENT_KINDS.CONSUMPTION, TARIFF_COMPONENT_KINDS.DEMAND];

/**
 * @description The contract of a meter active at an instant (contracts sorted by
 * `valid_from` DESC: the first match is the most recent one covering the date).
 * @param {Array<object>} contracts - Sorted contracts.
 * @param {number} ms - Instant.
 * @returns {object|undefined} The contract.
 * @example
 * findContractAt(contracts, Date.now());
 */
function findContractAt(contracts, ms) {
  return contracts.find((c) => {
    const { date } = getLocalContext(ms, c.timezone);
    return c.valid_from <= date && (c.valid_to === null || c.valid_to >= date);
  });
}

/**
 * @description The first contract start after an instant, or the end given.
 * @param {Array<number>} startsMs - Contract starts.
 * @param {number} afterMs - Instant.
 * @param {number} endMs - Upper bound.
 * @returns {number} The next start, bounded.
 * @example
 * nextContractStart([1000], 500, 2000); // 1000
 */
function nextContractStart(startsMs, afterMs, endMs) {
  return startsMs.reduce((min, ms) => (ms > afterMs && ms < min ? ms : min), endMs);
}

/**
 * @description The fixed charges (subscription, standing charges, and the taxes on them) of a
 * meter over display periods, computed from its contracts without any stored state
 * (docs/specs/energy-contracts.md, section 8.1): a period is cut at every local midnight of the
 * contract active at that point, each piece is priced by the engine with the consumption and
 * demand components excluded, so the pro rata, the period conditions of a fixed component
 * and a contract change inside the period are the engine's, and an instant no contract covers
 * costs nothing.
 * @param {Array<object>} contracts - The plain contracts of one meter (`tariff`, `inputs`,
 * `timezone`, `valid_from`, `valid_to`, `billing_period_start_day`, `name`).
 * @param {Array<object>} periods - [{ starts_at, ends_at }] as instants (Date, ISO string or ms).
 * @returns {Array<object>} One entry per period: { starts_at, ends_at, value, contract_name }
 * (`contract_name` is the contract active at the period start, or the first one met);
 * empty when no contract carries a fixed component.
 * @example
 * computeFixedCharges(contracts, [{ starts_at: '2026-01-01T00:00:00Z', ends_at: '2026-01-02T00:00:00Z' }]);
 */
function computeFixedCharges(contracts, periods) {
  const sorted = [...contracts]
    .map((contract) => ({ contract, compiled: compileTariff(contract.tariff, contract.inputs || {}) }))
    .sort((a, b) => (a.contract.valid_from < b.contract.valid_from ? 1 : -1));
  const hasFixed = sorted.some(({ compiled }) =>
    compiled.components.some((c) => c.kind === TARIFF_COMPONENT_KINDS.FIXED),
  );
  if (!hasFixed || periods.length === 0) {
    return [];
  }
  const plainContracts = sorted.map(({ contract }) => contract);
  const startsMs = plainContracts.map((c) => localToUtcMs(c.valid_from, c.timezone));
  // the pieces of every period, grouped by contract, priced in one engine run per contract
  const piecesByContract = new Map();
  const results = periods.map((period) => {
    const startMs = new Date(period.starts_at).getTime();
    const endMs = new Date(period.ends_at).getTime();
    const result = { starts_at: period.starts_at, ends_at: period.ends_at, value: 0, contract_name: null };
    let cursor = startMs;
    while (cursor < endMs) {
      const contract = findContractAt(plainContracts, cursor);
      if (contract === undefined) {
        // jump to the next contract start, in its own timezone, or to the end of the period
        cursor = nextContractStart(startsMs, cursor, endMs);
      } else {
        if (result.contract_name === null) {
          result.contract_name = contract.name;
        }
        const { date } = getLocalContext(cursor, contract.timezone);
        const pieceEnd = Math.min(endMs, getDayBounds(date, contract.timezone).endMs);
        if (!piecesByContract.has(contract.id)) {
          piecesByContract.set(contract.id, []);
        }
        piecesByContract.get(contract.id).push({
          result,
          startMs: cursor,
          interval: {
            starts_at: new Date(cursor).toISOString(),
            kwh: 0,
            duration_minutes: (pieceEnd - cursor) / MS_PER_MINUTE,
          },
        });
        cursor = pieceEnd;
      }
    }
    return result;
  });
  sorted.forEach(({ contract, compiled }) => {
    const pieces = piecesByContract.get(contract.id);
    if (!pieces) {
      return;
    }
    // two periods may share a start (a day and its first hour): the engine returns the
    // costs sorted by start, and its sort is stable, so the pieces are zipped once sorted
    // the same way rather than looked up by start
    const ordered = [...pieces].sort((a, b) => a.startMs - b.startMs);
    const { costs } = priceIntervals(
      compiled,
      contract,
      ordered.map((p) => p.interval),
      { exclude_kinds: DISPLAY_EXCLUDED_KINDS },
    );
    ordered.forEach((piece, index) => {
      piece.result.value += costs[index].cost;
    });
  });
  return results.map((result) => ({ ...result, value: roundCost(result.value) }));
}

module.exports = { computeFixedCharges, findContractAt };
