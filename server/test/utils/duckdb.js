const db = require('../../models');

const DEFAULT_TABLES = [
  't_device_feature_state',
  't_device_feature_state_aggregate',
  't_energy_price',
  't_device_feature',
  't_device_param',
  't_device',
];

const isMissingTableError = (error) => {
  if (!error) {
    return false;
  }
  const message = String(error.message || error);
  return message.includes('does not exist') || message.includes('Catalog Error') || message.includes('no such table');
};

const clearDuckDb = async () => {
  // Delete children first to avoid FK issues.
  // eslint-disable-next-line no-restricted-syntax
  for (const table of DEFAULT_TABLES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await db.duckDbWriteConnectionAllAsync(`DELETE FROM ${table}`);
    } catch (e) {
      if (!isMissingTableError(e)) {
        throw e;
      }
    }
  }
};

module.exports = {
  clearDuckDb,
};
