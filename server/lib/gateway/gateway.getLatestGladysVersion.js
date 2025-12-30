const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Return latest version of Gladys.
 * @returns {Promise} Resolve with latest version of Gladys.
 * @example
 * getLatestGladysVersion();
 */
async function getLatestGladysVersion() {
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
