const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Count the states of every feature in the whole history, and read the space the
 * history takes on disk.
 * @returns {Promise<object>} Resolve with the states count per feature id, their total and the
 * size of the DuckDB database in bytes.
 * @example
 * const { statesByFeatureId, totalStates, databaseSizeInBytes } = await countAllFeaturesStates();
 */
async function countAllFeaturesStates() {
  logger.debug('Device : getDeviceStatesSize : counting the states of every feature');
  // The states of one feature are spread over the whole table: counting a single feature
  // reads it all anyway, so every feature is counted in the same pass.
  const rows = await db.duckDbReadConnectionAllAsync(`
    SELECT device_feature_id, COUNT(*) AS states
    FROM t_device_feature_state
    GROUP BY device_feature_id
  `);
  const [{ used_bytes: usedBytes }] = await db.duckDbReadConnectionAllAsync(`
    SELECT block_size * used_blocks AS used_bytes
    FROM pragma_database_size()
    WHERE database_name = current_database()
  `);
  const statesByFeatureId = new Map();
  let totalStates = 0;
  rows.forEach((row) => {
    const states = Number(row.states);
    statesByFeatureId.set(row.device_feature_id, states);
    totalStates += states;
  });
  return { statesByFeatureId, totalStates, databaseSizeInBytes: Number(usedBytes) };
}

/**
 * @description Get how many states the history holds for each feature of a device, and roughly
 * how much space they take on disk.
 * @param {string} selector - Selector of the device.
 * @returns {Promise<object>} Resolve with the number of states and their estimated size in bytes,
 * per feature of the device.
 * @example
 * const { features } = await device.getDeviceStatesSize('kitchen-plug');
 */
async function getDeviceStatesSize(selector) {
  const device = this.stateManager.get('device', selector);
  if (device === null) {
    throw new NotFoundError('DEVICE_NOT_FOUND');
  }

  // Counting the whole history is a full scan of the only DuckDB read connection: the result
  // serves every device and is kept a while, so opening device pages costs one scan at most.
  const cacheIsFresh =
    this.featuresStatesSizeCache &&
    Date.now() - this.featuresStatesSizeCache.computedAt < this.FEATURES_STATES_SIZE_CACHE_DURATION_IN_MS;
  let counts;
  if (cacheIsFresh) {
    ({ counts } = this.featuresStatesSizeCache);
  } else {
    // Callers arriving while a count runs share it, instead of each queuing another scan.
    if (!this.featuresStatesSizeInFlight) {
      const generation = this.featuresStatesSizeGeneration;
      const inFlight = (async () => {
        try {
          const freshCounts = await countAllFeaturesStates();
          // A purge that ran during the count may have deleted states it saw: such a result
          // still answers the callers waiting for it, but is not kept for the next ones.
          if (generation === this.featuresStatesSizeGeneration) {
            this.featuresStatesSizeCache = { computedAt: Date.now(), counts: freshCounts };
          }
          return freshCounts;
        } finally {
          // On a failure too, so the next call retries. A purge may already have replaced
          // this count by a fresh one, which must stay shared.
          if (this.featuresStatesSizeInFlight === inFlight) {
            this.featuresStatesSizeInFlight = null;
          }
        }
      })();
      this.featuresStatesSizeInFlight = inFlight;
    }
    // The result of the count itself, not the cache: a purge can empty the cache meanwhile.
    counts = await this.featuresStatesSizeInFlight;
  }

  const { statesByFeatureId, totalStates, databaseSizeInBytes } = counts;
  return {
    device_selector: selector,
    features: (device.features || []).map((deviceFeature) => {
      const states = statesByFeatureId.get(deviceFeature.id) || 0;
      return {
        device_feature_selector: deviceFeature.selector,
        states,
        // The history is almost the only thing DuckDB stores, so the share of its states gives an
        // estimate of the space a feature takes. Only an estimate: values that rarely change
        // compress better than values that change all the time.
        estimated_size_in_bytes: totalStates > 0 ? Math.round((states / totalStates) * databaseSizeInBytes) : 0,
      };
    }),
  };
}

module.exports = {
  getDeviceStatesSize,
};
