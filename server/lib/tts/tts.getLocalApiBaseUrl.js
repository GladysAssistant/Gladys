const os = require('os');

/**
 * @description Base URL of this Gladys instance as seen from the LAN — the
 * audio URL handed to a speaker must be fetchable by the speaker, not by
 * Gladys. Same port resolution as server/index.js (SERVER_PORT, 1443 by
 * default); the address is the first non-internal IPv4 of the host
 * (Gladys runs in host network mode on the standard install).
 * @returns {string} The base URL, without trailing slash.
 * @example
 * const baseUrl = gladys.tts.getLocalApiBaseUrl();
 */
function getLocalApiBaseUrl() {
  const serverPort = parseInt(process.env.SERVER_PORT, 10) || 1443;
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';
  const allAddresses = [];
  Object.keys(interfaces).forEach((interfaceName) => {
    (interfaces[interfaceName] || []).forEach((address) => {
      allAddresses.push(address);
    });
  });
  const firstExternalIpv4 = allAddresses.find((address) => address.family === 'IPv4' && address.internal === false);
  if (firstExternalIpv4) {
    localIp = firstExternalIpv4.address;
  }
  return `http://${localIp}:${serverPort}`;
}

module.exports = {
  getLocalApiBaseUrl,
};
