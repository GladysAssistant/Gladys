const os = require('os');

const logger = require('../../utils/logger');
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
 * Docker ones; behind a Docker bridge the only address is the container's,
 * which no speaker can reach — the URL is still minted (there is nothing
 * better to advertise) but the situation is logged.
 * @returns {Promise<string>} Resolve with the base URL, without trailing slash.
 * @example
 * const baseUrl = await gladys.tts.getLocalApiBaseUrl();
 */
async function getLocalApiBaseUrl() {
  const onHostNetwork = await this.system.isOnHostNetwork();
  if (!onHostNetwork) {
    logger.warn(
      'TTS: Gladys runs behind a Docker bridge, the audio URL handed to speakers carries the container address and cannot be reached from the LAN. Use host network mode (the standard install) or the Gladys Plus provider.',
    );
  }
  const localIp = getLocalIp(os.networkInterfaces()) || 'localhost';
  return `http://${localIp}:${getServerPort()}`;
}

module.exports = {
  getLocalApiBaseUrl,
};
