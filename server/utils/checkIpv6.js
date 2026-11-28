const os = require('os');

/**
 * @description Tell if the machine has an IPv6 address Matter can use. Matter only works over
 * IPv6, on an interface that is not internal. Shared by the Matter controller (`matter` service)
 * and the Matter bridge (`matter-bridge` service).
 * @param {Function} [networkInterfaces] - Lists the network interfaces, os.networkInterfaces by default.
 * @param {object} [options] - Options.
 * @param {boolean} [options.allowLinkLocal] - Accept a link-local address (fe80::). The Matter
 * bridge is reached by the controllers of its own network, which link-local is enough for. The
 * Matter controller is not given it: it must reach Thread devices behind a border router, on a
 * routable prefix.
 * @returns {object} Whether IPv6 is available, and the IPv6 interfaces found.
 * @example
 * const { hasIpv6, ipv6Interfaces } = checkIpv6();
 */
function checkIpv6(networkInterfaces = os.networkInterfaces, { allowLinkLocal = false } = {}) {
  const ipv6Interfaces = Object.values(networkInterfaces())
    .flat()
    .filter(
      (iface) => iface.family === 'IPv6' && !iface.internal && (allowLinkLocal || !iface.address.startsWith('fe80:')),
    );
  return { hasIpv6: ipv6Interfaces.length > 0, ipv6Interfaces };
}

module.exports = {
  checkIpv6,
};
