const fs = require('fs');

const logger = require('../../utils/logger');

// systemd system DBus socket, standard locations (checked on the Gladys FS).
const DBUS_SYSTEM_SOCKETS = ['/run/dbus/system_bus_socket', '/var/run/dbus/system_bus_socket'];
// dbus-send client binary, standard locations.
const DBUS_SEND_BINARIES = ['/usr/bin/dbus-send', '/bin/dbus-send'];

/**
 * @description Extract the reply value from a `dbus-send --print-reply` output
 * (which prints e.g. `   string "yes"`). Docker log frames add binary headers,
 * so non-printable bytes are stripped first.
 * @param {string} output - Raw dbus-send output.
 * @returns {string|null} The reply string (yes/no/challenge/na) or null.
 * @example
 * parseCanReply('method return ...\n   string "yes"');
 */
function parseCanReply(output) {
  if (!output) {
    return null;
  }
  // eslint-disable-next-line no-control-regex
  const sanitized = output.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ');
  const match = /string\s+"([^"]+)"/.exec(sanitized);
  return match ? match[1].trim() : null;
}

/**
 * @description logind CanReboot/CanPowerOff answers "yes", "challenge" (allowed
 * only after an interactive authentication), "no" or "na" (not available).
 * Reboot/PowerOff are called with `boolean:false` (non-interactive), so
 * "challenge" would be refused at click time: only "yes" counts as available.
 * @param {string} reply - Parsed reply value.
 * @returns {boolean} True if the action is available.
 * @example
 * replyMeansAvailable('yes');
 */
function replyMeansAvailable(reply) {
  return reply === 'yes';
}

/**
 * @description Detect (and cache on the instance) how the host can be
 * rebooted/powered off: `'local'` (Gladys reaches /run/dbus directly),
 * `'docker-helper'` (via a helper container through the Docker socket), or
 * `null` (not possible). Both branches confirm with a non-destructive CanReboot
 * probe. Result is cached in `this.hostPowerManagement`.
 * @returns {Promise<string|null>} Resolve with the mechanism or null.
 * @example
 * await system.detectHostPowerManagement();
 */
async function detectHostPowerManagement() {
  if (process.platform !== 'linux') {
    this.hostPowerManagement = null;
    return null;
  }

  // 1. Local: Gladys can reach the host system DBus socket directly (bare-metal
  //    install, or a container that happens to mount it). The cheap FS check is
  //    only a pre-filter: having the socket does not mean polkit allows the
  //    action, so confirm with the same non-destructive CanReboot probe.
  const hasLocalBinary = DBUS_SEND_BINARIES.some((binaryPath) => fs.existsSync(binaryPath));
  const hasLocalSocket = DBUS_SYSTEM_SOCKETS.some((socketPath) => fs.existsSync(socketPath));
  if (hasLocalBinary && hasLocalSocket) {
    try {
      const reply = parseCanReply(await this.runHostPowerDbusCommand('CanReboot', 'local'));
      if (replyMeansAvailable(reply)) {
        this.hostPowerManagement = 'local';
        return 'local';
      }
      logger.info(`System: local host power probe returned "${reply}" — not available`);
    } catch (e) {
      logger.info('System: host power management not available locally');
      logger.debug(e);
    }
  }

  // 2. Docker helper: no local socket, but if the Docker daemon is reachable we
  //    can act through a helper container. A non-destructive CanReboot probe
  //    tells us whether the host actually supports it.
  if (this.dockerode) {
    try {
      const reply = parseCanReply(await this.runHostPowerDbusCommand('CanReboot', 'docker-helper'));
      if (replyMeansAvailable(reply)) {
        this.hostPowerManagement = 'docker-helper';
        return 'docker-helper';
      }
      logger.info(`System: host power management probe returned "${reply}" — not available`);
    } catch (e) {
      logger.info('System: host power management not available through the Docker helper');
      logger.debug(e);
    }
  }

  this.hostPowerManagement = null;
  return null;
}

module.exports = {
  detectHostPowerManagement,
  parseCanReply,
  replyMeansAvailable,
};
