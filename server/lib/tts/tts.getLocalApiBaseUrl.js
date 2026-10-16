const os = require('os');

const { getLocalIp } = require('../system/system.getInfos');
const { getServerPort } = require('../../utils/getServerPort');

/**
 * @description Base URL of this Gladys instance as seen from the LAN — the
 * audio URL handed to a speaker must be fetchable by the speaker, not by
 * Gladys. Same address and port resolution as the System settings page
 * (system.getLocalIp: Docker bridges and virtual interfaces are never
 * candidates, a VPN address is a last resort, a wired RFC1918 address wins;
 * getServerPort: SERVER_PORT, 1443 by default). Gladys runs in host network
 * mode on the standard install, so the real NICs are visible next to the
 * Docker ones.
 * @returns {string} The base URL, without trailing slash.
 * @example
 * const baseUrl = gladys.tts.getLocalApiBaseUrl();
 */
function getLocalApiBaseUrl() {
  const localIp = getLocalIp(os.networkInterfaces()) || 'localhost';
  return `http://${localIp}:${getServerPort()}`;
}

module.exports = {
  getLocalApiBaseUrl,
};
