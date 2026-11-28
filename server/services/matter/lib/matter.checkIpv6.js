const { checkIpv6: checkSystemIpv6 } = require('../../../utils/checkIpv6');

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
  return checkSystemIpv6(() => this.os.networkInterfaces());
}

module.exports = {
  checkIpv6,
};
