const os = require('os');

/**
 * @description Checks if the system has a valid IPv6 configuration.
 * Matter protocol requires IPv6 to be working properly.
 * This function inspects all network interfaces to detect
 * if any non-internal IPv6 network interfaces are available.
 * @returns {object} Return if ipv6 is available and the ipv6 interfaces.
 * @example
 * const { hasIpv6, ipv6Interfaces } = checkIpv6();
 * if (!ipv6Available) {
 *   console.log('Warning: IPv6 is not properly configured. Matter requires IPv6 to function correctly.');
 * }
 */
function checkIpv6() {
  const networkInterfaces = os.networkInterfaces();
  let hasIpv6 = false;
  const ipv6Interfaces = [];

  Object.keys(networkInterfaces).forEach((ifName) => {
    networkInterfaces[ifName].forEach((iface) => {
      // Check if interface is IPv6 and not internal
      if (iface.family === 'IPv6' && !iface.internal) {
        hasIpv6 = true;
        ipv6Interfaces.push(iface);
      }
    });
  });

  return {
    hasIpv6,
    ipv6Interfaces,
  };
}

module.exports = {
  checkIpv6,
};
