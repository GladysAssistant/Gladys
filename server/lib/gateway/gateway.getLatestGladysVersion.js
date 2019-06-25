/**
 * @description Return latest version of Gladys.
 * @returns {Promise} Resolve with latest version of Gladys.
 * @example
 * getLatestGladysVersion();
 */
async function getLatestGladysVersion() {
  const systemInfos = await this.system.getInfos();
  const clientId = await this.variable.getValue('GLADYS_INSTANCE_CLIENT_ID');
  const params = {
    system: systemInfos.platform,
    node_version: systemInfos.nodejs_version,
    is_docker: systemInfos.is_docker,
    client_id: clientId,
  };
  const latestGladysVersion = await this.gladysGatewayClient.getLatestGladysVersion(systemInfos.gladys_version, params);
  this.system.saveLatestGladysVersion(latestGladysVersion.name);
  return latestGladysVersion;
}

module.exports = {
  getLatestGladysVersion,
};
