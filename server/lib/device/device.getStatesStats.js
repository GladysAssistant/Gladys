const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Count the states saved in the history of each device over the last hours,
 * to spot the verbose devices that fill the database.
 * @returns {Promise<object>} Resolve with the total number of states of the period, and the
 * number of states per device and per feature, most verbose first.
 * @example
 * const statesStats = await device.getStatesStats();
 */
async function getStatesStats() {
  const now = Date.now();
  // The count scans the whole period of the history: on a low-power machine it is not free,
  // and the devices list asks for it on every visit, so a recent result is served again.
  if (this.statesStatsCache && now - this.statesStatsCache.computedAt < this.STATES_STATS_CACHE_DURATION_IN_MS) {
    return this.statesStatsCache.stats;
  }
  const periodStart = new Date(now - this.STATES_STATS_PERIOD_IN_HOURS * 60 * 60 * 1000);
  logger.debug(`Device : getStatesStats : counting states saved since ${periodStart.toISOString()}`);
  const rows = await db.duckDbReadConnectionAllAsync(
    `
      SELECT device_feature_id, COUNT(*) AS states
      FROM t_device_feature_state
      WHERE created_at >= ?
      GROUP BY device_feature_id
    `,
    periodStart,
  );

  let totalStates = 0;
  const statsByDeviceId = new Map();
  rows.forEach((row) => {
    const states = Number(row.states);
    totalStates += states;
    const deviceFeature = this.stateManager.get('deviceFeatureById', row.device_feature_id);
    const device = deviceFeature ? this.stateManager.get('deviceById', deviceFeature.device_id) : null;
    // The states of a deleted device stay in the history until the orphaned states purge:
    // they count in the total, which is what the database really holds, but belong to no device.
    if (!device) {
      return;
    }
    if (!statsByDeviceId.has(device.id)) {
      statsByDeviceId.set(device.id, { device_id: device.id, states: 0, is_verbose: false, features: [] });
    }
    const deviceStats = statsByDeviceId.get(device.id);
    const isVerbose = states >= this.VERBOSE_DEVICE_FEATURE_MIN_STATES;
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

  const stats = {
    period_in_hours: this.STATES_STATS_PERIOD_IN_HOURS,
    verbose_device_feature_min_states: this.VERBOSE_DEVICE_FEATURE_MIN_STATES,
    total_states: totalStates,
    devices,
  };
  this.statesStatsCache = { computedAt: now, stats };
  return stats;
}

module.exports = {
  getStatesStats,
};
