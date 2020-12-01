const { exec } = require('../../../utils/childProcess');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * installMqttContainer();
 */
async function getHostIP() {
  // Get Host machine IP
  const HostIP = await exec(
    '/sbin/ip route|awk \'/default/ { for (i=1;i<=NF;i++) { if ($i == "src") { print $(i+1) }}}\'',
  );

  return HostIP;
}

module.exports = {
  getHostIP,
};
