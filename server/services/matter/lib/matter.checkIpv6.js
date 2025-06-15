/**
 * @description Checks if the system has a valid IPv6 configuration.
 * Matter protocol requires IPv6 to be working properly.
 * This function inspects all network interfaces to detect
 * if any non-internal, non-link-local IPv6 network interfaces are available.
 * @returns {object} Return if ipv6 is available and the ipv6 interfaces.
 * @example
 * const { hasIpv6, ipv6Interfaces } = checkIpv6();
 * if (!hasIpv6) {
 *   console.log('Warning: IPv6 is not properly configured. Matter requires IPv6 to function correctly.');
 * }
 */
function checkIpv6() {
  const networkInterfaces = this.os.networkInterfaces();
  let hasIpv6 = false;
  const ipv6Interfaces = [];

  Object.keys(networkInterfaces).forEach((ifName) => {
    networkInterfaces[ifName].forEach((iface) => {
      // Check if interface is IPv6, not internal, and not a link-local address
      if (iface.family === 'IPv6' && !iface.internal && !iface.address.startsWith('fe80:')) {
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
