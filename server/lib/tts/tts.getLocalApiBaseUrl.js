const os = require('os');

// Docker-side interfaces: a speaker can never fetch from a bridge address
// (docker0 172.17.0.0/16, the br-* integration bridges 172.30.0.0/24...) —
// same skip list as networkDiscovery.scanUdpActiveBroadcast.js, excluded
// from the candidates entirely.
const DOCKER_INTERFACE_PREFIXES = ['docker', 'br-', 'veth'];
// Tunnel interfaces (VPN): their address is only reachable by VPN peers,
// not by the LAN speakers this URL is minted for — kept as a last-resort
// candidate only, after every physical NIC.
const TUNNEL_INTERFACE_PREFIXES = ['tun', 'tap', 'wg', 'tailscale', 'zt'];
// RFC1918 private ranges: on a multi-homed host the home-LAN address is
// the one a speaker can actually fetch — prefer it over a public address.
const isPrivateIpv4 = (address) =>
  /^10\./.test(address) || /^192\.168\./.test(address) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(address);

const startsWithOneOf = (interfaceName, prefixes) => prefixes.some((prefix) => interfaceName.startsWith(prefix));

/**
 * @description Base URL of this Gladys instance as seen from the LAN — the
 * audio URL handed to a speaker must be fetchable by the speaker, not by
 * Gladys. Same port resolution as server/index.js (SERVER_PORT, 1443 by
 * default). Address preference: RFC1918 IPv4 of a physical NIC, then
 * RFC1918 of a tunnel interface, then any non-internal IPv4 — Docker
 * bridges are never candidates (Gladys runs in host network mode on the
 * standard install, so they are visible next to the real NICs).
 * @returns {string} The base URL, without trailing slash.
 * @example
 * const baseUrl = gladys.tts.getLocalApiBaseUrl();
 */
function getLocalApiBaseUrl() {
  const serverPort = parseInt(process.env.SERVER_PORT, 10) || 1443;
  const interfaces = os.networkInterfaces();
  const candidates = [];
  Object.keys(interfaces).forEach((interfaceName) => {
    if (startsWithOneOf(interfaceName, DOCKER_INTERFACE_PREFIXES)) {
      return;
    }
    (interfaces[interfaceName] || []).forEach((address) => {
      if (address.family === 'IPv4' && address.internal === false) {
        candidates.push({ interfaceName, address: address.address });
      }
    });
  });
  const preferred =
    candidates.find(
      (candidate) =>
        isPrivateIpv4(candidate.address) && !startsWithOneOf(candidate.interfaceName, TUNNEL_INTERFACE_PREFIXES),
    ) ||
    candidates.find((candidate) => isPrivateIpv4(candidate.address)) ||
    candidates[0];
  const localIp = preferred ? preferred.address : 'localhost';
  return `http://${localIp}:${serverPort}`;
}

module.exports = {
  getLocalApiBaseUrl,
};
