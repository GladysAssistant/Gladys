const os = require('os');

// RFC1918 private ranges: on a multi-homed host (VPN tunnel, secondary
// NIC, stray Docker bridge) the home-LAN address is the one a speaker can
// actually fetch — prefer it over whatever interface enumerates first.
const isPrivateIpv4 = (address) =>
  /^10\./.test(address) || /^192\.168\./.test(address) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(address);

/**
 * @description Base URL of this Gladys instance as seen from the LAN — the
 * audio URL handed to a speaker must be fetchable by the speaker, not by
 * Gladys. Same port resolution as server/index.js (SERVER_PORT, 1443 by
 * default); the address is the first RFC1918 IPv4 of the host, falling
 * back to the first non-internal IPv4 (Gladys runs in host network mode
 * on the standard install).
 * @returns {string} The base URL, without trailing slash.
 * @example
 * const baseUrl = gladys.tts.getLocalApiBaseUrl();
 */
function getLocalApiBaseUrl() {
  const serverPort = parseInt(process.env.SERVER_PORT, 10) || 1443;
  const interfaces = os.networkInterfaces();
  const allAddresses = [];
  Object.keys(interfaces).forEach((interfaceName) => {
    (interfaces[interfaceName] || []).forEach((address) => {
      allAddresses.push(address);
    });
  });
  const externalIpv4 = allAddresses.filter((address) => address.family === 'IPv4' && address.internal === false);
  const preferred = externalIpv4.find((address) => isPrivateIpv4(address.address)) || externalIpv4[0];
  const localIp = preferred ? preferred.address : 'localhost';
  return `http://${localIp}:${serverPort}`;
}

module.exports = {
  getLocalApiBaseUrl,
};
