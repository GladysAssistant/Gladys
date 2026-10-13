const logger = require('../../utils/logger');

// Bound of the recalculations one source (a calendar, a meter fed by an integration) can
// trigger (capabilities/energy-contracts.md, section 2): a request within the window is merged
// into the next run, which keeps the earliest `from`.
const RECALCULATION_MIN_INTERVAL_MS = 10 * 60 * 1000;

/**
 * @description The earliest of a pending instant and a new one.
 * @param {Date|null} pending - The instant already pending, if any.
 * @param {Date} from - The new instant.
 * @returns {Date} The earliest.
 * @example
 * earliest(null, new Date());
 */
function earliest(pending, from) {
  return pending === null || from < pending ? from : pending;
}

/**
 * @description Run a recalculation now, or defer it to the end of the bounding window when the
 * last one for the same key is more recent than the window: the requests received meanwhile
 * are merged into that single deferred run, which starts from the earliest instant asked. A run
 * that fails (the database unreachable) does not lose its instant: it is merged back and the
 * run is retried after the cooldown, since the states or entries that asked for it are already
 * stored and nothing else would recompute their costs.
 * @param {Map} states - key -> { last_at, timer, from }, owned by the caller (tests clear the timers).
 * @param {string} key - The bounding key (a calendar key, a meter id).
 * @param {Date} from - Recompute from this instant.
 * @param {Function} run - async (from) => void, the recalculation itself.
 * @returns {Promise<void>} Resolves when run, or when deferred; rejects when a run started now fails.
 * @example
 * await scheduleBoundedRecalculation(this.calendarRecalculations, 'tempo', from, (pendingFrom) => …);
 */
async function scheduleBoundedRecalculation(states, key, from, run) {
  const state = states.get(key) || { last_at: 0, timer: null, from: null };
  state.from = earliest(state.from, from);
  states.set(key, state);
  let execute;
  const defer = (delay) => {
    if (state.timer === null) {
      state.timer = setTimeout(() => {
        execute().catch((e) => logger.warn(`Recalculation "${key}" failed: ${e.message}`));
      }, delay);
    }
  };
  execute = async () => {
    state.timer = null;
    state.last_at = Date.now();
    const pendingFrom = state.from;
    state.from = null;
    try {
      await run(pendingFrom);
    } catch (e) {
      state.from = earliest(state.from, pendingFrom);
      defer(RECALCULATION_MIN_INTERVAL_MS);
      throw e;
    }
  };
  const elapsed = Date.now() - state.last_at;
  if (elapsed >= RECALCULATION_MIN_INTERVAL_MS) {
    await execute();
  } else {
    defer(RECALCULATION_MIN_INTERVAL_MS - elapsed);
  }
}

module.exports = { scheduleBoundedRecalculation, RECALCULATION_MIN_INTERVAL_MS };
