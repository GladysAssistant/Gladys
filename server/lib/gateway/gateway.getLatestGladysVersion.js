const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Return latest version of Gladys.
 * @returns {Promise} Resolve with latest version of Gladys, or null when this
 * instance is not an official release image.
 * @example
 * getLatestGladysVersion();
 */
async function getLatestGladysVersion() {
  // This call also sends usage statistics to Gladys Plus: every caller (startup,
  // scheduled check, upgrade notification, API) goes through here, so only the
  // official release images send it — never a development server, a CI run, an
  // AI agent or a pull request/dev image.
  if (!this.system.isOfficialReleaseImage()) {
    logger.debug('Gladys : not an official release image, skipping the latest Gladys version check');
    return null;
  }
  logger.info('Gladys : getLatestGladysVersion');
  const systemInfos = await this.system.getInfos();
  const clientId = await this.variable.getValue('GLADYS_INSTANCE_CLIENT_ID');
  // Use estimated_size from DuckDB metadata for fast approximate count
  // This avoids a full table scan which can be very slow with millions of rows
  const [{ estimated_size: deviceStateCount }] = await db.duckDbReadConnectionAllAsync(`
    SELECT estimated_size FROM duckdb_tables() WHERE table_name = 't_device_feature_state';
  `);
  logger.info(`Device state count in DuckDB: ${deviceStateCount}`);
  const serviceUsage = await this.serviceManager.getUsage();
  const params = {
    system: systemInfos.platform,
    node_version: systemInfos.nodejs_version,
    is_docker: systemInfos.is_docker,
    client_id: clientId,
    device_state_count: Number(deviceStateCount),
    integrations: serviceUsage,
  };
  const latestGladysVersion = await this.gladysGatewayClient.getLatestGladysVersion(systemInfos.gladys_version, params);
  this.system.saveLatestGladysVersion(latestGladysVersion.name);
  return latestGladysVersion;
}

module.exports = {
  getLatestGladysVersion,
};
