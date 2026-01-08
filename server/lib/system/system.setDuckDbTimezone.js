const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * @description Set DuckDB timezone.
 * @example
 * setDuckDbTimezone();
 */
async function setDuckDbTimezone() {
  // Set DuckDB timezone
  const timezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  if (timezone) {
    logger.info(`Setting DuckDB timezone to ${timezone}`);
    await db.duckDbSetTimezone(timezone);
  }
}

module.exports = {
  setDuckDbTimezone,
};
