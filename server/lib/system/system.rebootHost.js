const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Reboot the host machine through systemd-logind, using whichever
 * mechanism is available (direct on the host, or via a Docker helper container).
 * @returns {Promise} Resolve when the reboot command was sent.
 * @example
 * await system.rebootHost();
 */
async function rebootHost() {
  const mechanism = this.hostPowerManagement || (await this.detectHostPowerManagement());
  if (!mechanism) {
    throw new PlatformNotCompatible('HOST_POWER_MANAGEMENT_NOT_AVAILABLE');
  }
  logger.info(`System: rebooting host (mechanism: ${mechanism})`);
  await this.runHostPowerDbusCommand('Reboot', mechanism);
}

module.exports = {
  rebootHost,
};
