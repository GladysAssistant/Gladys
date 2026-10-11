const logger = require('../../utils/logger');

// Bound of the recalculations one source (a calendar, a meter fed by an integration) can
// trigger (capabilities/energy-contracts.md, section 2): a request within the window is merged
// into the next run, which keeps the earliest `from`.
const RECALCULATION_MIN_INTERVAL_MS = 10 * 60 * 1000;

/**
 * @description Run a recalculation now, or defer it to the end of the bounding window when the
 * last one for the same key is more recent than the window: the requests received meanwhile
 * are merged into that single deferred run, which starts from the earliest instant asked.
 * @param {Map} states - key -> { last_at, timer, from }, owned by the caller (tests clear the timers).
 * @param {string} key - The bounding key (a calendar key, a meter id).
 * @param {Date} from - Recompute from this instant.
 * @param {Function} run - async (from) => void, the recalculation itself.
 * @returns {Promise<void>} Resolves when run, or when deferred.
 * @example
 * await scheduleBoundedRecalculation(this.calendarRecalculations, 'tempo', from, (pendingFrom) => …);
 */
async function scheduleBoundedRecalculation(states, key, from, run) {
  const state = states.get(key) || { last_at: 0, timer: null, from: null };
  state.from = state.from === null || from < state.from ? from : state.from;
  states.set(key, state);
  const execute = async () => {
    state.timer = null;
    state.last_at = Date.now();
    const pendingFrom = state.from;
    state.from = null;
    await run(pendingFrom);
  };
  const elapsed = Date.now() - state.last_at;
  if (elapsed >= RECALCULATION_MIN_INTERVAL_MS) {
    await execute();
  } else if (state.timer === null) {
    state.timer = setTimeout(() => {
      execute().catch((e) => logger.warn(`Recalculation "${key}" failed: ${e.message}`));
    }, RECALCULATION_MIN_INTERVAL_MS - elapsed);
  }
}

module.exports = { scheduleBoundedRecalculation, RECALCULATION_MIN_INTERVAL_MS };
