const os = require('os');

/**
 * @description Tell if the machine has an IPv6 address Matter can use. Matter only works over
 * IPv6: without a routable interface, ecosystems cannot reach the bridge. Same rule as the
 * Matter controller of the `matter` service: an IPv6 interface, neither internal nor link-local.
 * @param {Function} [networkInterfaces] - Lists the network interfaces, os.networkInterfaces by default.
 * @returns {object} Whether IPv6 is available, and the IPv6 interfaces found.
 * @example
 * const { hasIpv6, ipv6Interfaces } = checkIpv6();
 */
function checkIpv6(networkInterfaces = os.networkInterfaces) {
  const ipv6Interfaces = Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface.family === 'IPv6' && !iface.internal && !iface.address.startsWith('fe80:'));
  return { hasIpv6: ipv6Interfaces.length > 0, ipv6Interfaces };
}

module.exports = {
  checkIpv6,
};
