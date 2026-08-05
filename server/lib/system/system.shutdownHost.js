const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Power off the host machine through systemd-logind, using
 * whichever mechanism is available (direct on the host, or via a Docker helper
 * container).
 * @returns {Promise} Resolve when the power off command was sent.
 * @example
 * await system.shutdownHost();
 */
async function shutdownHost() {
  const mechanism = this.hostPowerManagement || (await this.detectHostPowerManagement());
  if (!mechanism) {
    throw new PlatformNotCompatible('HOST_POWER_MANAGEMENT_NOT_AVAILABLE');
  }
  logger.info(`System: powering off host (mechanism: ${mechanism})`);
  await this.runHostPowerDbusCommand('PowerOff', mechanism);
}

module.exports = {
  shutdownHost,
};
