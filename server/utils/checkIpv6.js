const os = require('os');

/**
 * @description Tell if the machine has an IPv6 address Matter can use. Matter only works over
 * IPv6: an interface that is IPv6, neither internal nor link-local, is needed. Shared by the
 * Matter controller (`matter` service) and the Matter bridge (`matter-bridge` service).
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
