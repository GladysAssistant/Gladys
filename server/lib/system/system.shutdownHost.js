const { promisify } = require('util');
const childProcess = require('child_process');

const logger = require('../../utils/logger');

const execAsync = promisify(childProcess.exec);

// Ask systemd-logind (over the system DBus) to power off the host machine.
// Same requirements as rebootHost: systemd host + system DBus socket reachable.
// `boolean:false` = non-interactive (no polkit prompt).
const POWER_OFF_COMMAND =
  'dbus-send --system --print-reply --dest=org.freedesktop.login1 ' +
  '/org/freedesktop/login1 org.freedesktop.login1.Manager.PowerOff boolean:false';

// Bound the DBus call: if the socket or systemd-logind is unavailable the
// command could otherwise hang forever. On timeout the child is killed and the
// promise rejects, so the caller gets a bounded failure.
const COMMAND_TIMEOUT_MS = 10000;

/**
 * @description Power off the host machine through systemd-logind (DBus).
 * @returns {Promise} Resolve when the power off command was sent.
 * @example
 * await system.shutdownHost();
 */
async function shutdownHost() {
  logger.info('System: powering off host through systemd-logind');
  await execAsync(POWER_OFF_COMMAND, { timeout: COMMAND_TIMEOUT_MS });
}

module.exports = {
  shutdownHost,
};
