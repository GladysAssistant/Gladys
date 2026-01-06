const db = require('../../models');

const DEFAULT_TABLES = [
  't_device_feature_state',
  't_device_feature_state_aggregate',
  't_energy_price',
  't_device_feature',
  't_device_param',
  't_device',
];

const clearDuckDb = async () => {
  // Delete children first to avoid FK issues.
  // eslint-disable-next-line no-restricted-syntax
  for (const table of DEFAULT_TABLES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await db.duckDbWriteConnectionAllAsync(`DELETE FROM ${table}`);
    } catch (e) {
      // ignore missing tables for DuckDB
    }
  }
};

module.exports = {
  clearDuckDb,
};
