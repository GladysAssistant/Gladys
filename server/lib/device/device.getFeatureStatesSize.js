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
  logger.debug('Device : getFeatureStatesSize : counting the states of every feature');
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
 * @description Get how many states of a feature the history holds, and roughly how much space
 * they take on disk.
 * @param {string} selector - Selector of the device feature.
 * @returns {Promise<object>} Resolve with the number of states and their estimated size in bytes.
 * @example
 * const { states, estimated_size_in_bytes } = await device.getFeatureStatesSize('kitchen-plug-power');
 */
async function getFeatureStatesSize(selector) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DEVICE_FEATURE_NOT_FOUND');
  }

  // Counting the whole history is a full scan of the only DuckDB read connection: the result
  // serves every feature and is kept a while, so opening device pages costs one scan at most.
  const cacheIsFresh =
    this.featuresStatesSizeCache &&
    Date.now() - this.featuresStatesSizeCache.computedAt < this.FEATURES_STATES_SIZE_CACHE_DURATION_IN_MS;
  if (!cacheIsFresh) {
    // Callers arriving while a count runs share it, instead of each queuing another scan.
    if (!this.featuresStatesSizeInFlight) {
      this.featuresStatesSizeInFlight = (async () => {
        try {
          const counts = await countAllFeaturesStates();
          this.featuresStatesSizeCache = { computedAt: Date.now(), counts };
        } finally {
          // On a failure too, so the next call retries.
          this.featuresStatesSizeInFlight = null;
        }
      })();
    }
    await this.featuresStatesSizeInFlight;
  }

  const { statesByFeatureId, totalStates, databaseSizeInBytes } = this.featuresStatesSizeCache.counts;
  const states = statesByFeatureId.get(deviceFeature.id) || 0;
  return {
    device_feature_selector: selector,
    states,
    // The history is almost the only thing DuckDB stores, so the share of its states gives an
    // estimate of the space a feature takes. Only an estimate: values that rarely change
    // compress better than values that change all the time.
    estimated_size_in_bytes: totalStates > 0 ? Math.round((states / totalStates) * databaseSizeInBytes) : 0,
  };
}

module.exports = {
  getFeatureStatesSize,
};
