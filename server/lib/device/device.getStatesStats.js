const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Count in the history the states of the period, per device and per feature.
 * @param {object} deviceManager - The device manager.
 * @returns {Promise<object>} Resolve with the states stats.
 * @example
 * const stats = await countStatesStats(deviceManager);
 */
async function countStatesStats(deviceManager) {
  const periodStart = new Date(Date.now() - deviceManager.STATES_STATS_PERIOD_IN_HOURS * 60 * 60 * 1000);
  logger.debug(`Device : getStatesStats : counting states saved since ${periodStart.toISOString()}`);
  // Bound as an instant, like the other history reads: a JS Date would be bound as a naive
  // timestamp and read in the DuckDB session timezone, shifting the window by its offset.
  const rows = await db.duckDbReadConnectionAllAsync(
    `
      SELECT device_feature_id, COUNT(*) AS states
      FROM t_device_feature_state
      WHERE created_at >= CAST(? AS TIMESTAMPTZ)
      GROUP BY device_feature_id
    `,
    periodStart.toISOString(),
  );

  let totalStates = 0;
  const statsByDeviceId = new Map();
  rows.forEach((row) => {
    const states = Number(row.states);
    totalStates += states;
    const deviceFeature = deviceManager.stateManager.get('deviceFeatureById', row.device_feature_id);
    const device = deviceFeature ? deviceManager.stateManager.get('deviceById', deviceFeature.device_id) : null;
    // The states of a deleted device stay in the history until the orphaned states purge:
    // they count in the total, which is what the database really holds, but belong to no device.
    if (!device) {
      return;
    }
    if (!statsByDeviceId.has(device.id)) {
      statsByDeviceId.set(device.id, { device_id: device.id, states: 0, is_verbose: false, features: [] });
    }
    const deviceStats = statsByDeviceId.get(device.id);
    const isVerbose = states >= deviceManager.VERBOSE_DEVICE_FEATURE_MIN_STATES;
    deviceStats.states += states;
    deviceStats.is_verbose = deviceStats.is_verbose || isVerbose;
    deviceStats.features.push({
      device_feature_id: deviceFeature.id,
      states,
      is_verbose: isVerbose,
    });
  });

  const devices = [...statsByDeviceId.values()].sort((a, b) => b.states - a.states);
  devices.forEach((deviceStats) => deviceStats.features.sort((a, b) => b.states - a.states));

  return {
    period_in_hours: deviceManager.STATES_STATS_PERIOD_IN_HOURS,
    verbose_device_feature_min_states: deviceManager.VERBOSE_DEVICE_FEATURE_MIN_STATES,
    total_states: totalStates,
    devices,
  };
}

/**
 * @description Count the states saved in the history of each device over the last hours,
 * to spot the verbose devices that fill the database.
 * @returns {Promise<object>} Resolve with the total number of states of the period, and the
 * number of states per device and per feature, most verbose first.
 * @example
 * const statesStats = await device.getStatesStats();
 */
async function getStatesStats() {
  // The count scans the whole period of the history on the only DuckDB read connection: on a
  // low-power machine it is not free, and the devices list asks for it on every visit, so a
  // recent result is served again.
  if (this.statesStatsCache && Date.now() - this.statesStatsCache.computedAt < this.STATES_STATS_CACHE_DURATION_IN_MS) {
    return this.statesStatsCache.stats;
  }
  // Callers arriving while a count runs share it, instead of each queuing another scan.
  if (!this.statesStatsInFlight) {
    this.statesStatsInFlight = (async () => {
      try {
        const stats = await countStatesStats(this);
        // Stamped once the result exists: a slow count must not already be expired when it lands.
        this.statesStatsCache = { computedAt: Date.now(), stats };
        return stats;
      } finally {
        // On a failure too, so the next visit retries.
        this.statesStatsInFlight = null;
      }
    })();
  }
  return this.statesStatsInFlight;
}

module.exports = {
  getStatesStats,
};
