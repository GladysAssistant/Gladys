const { promisify } = require('util');
const childProcess = require('child_process');

const logger = require('../../utils/logger');

const execAsync = promisify(childProcess.exec);

// Ask systemd-logind (over the system DBus) to reboot the host machine.
// Works when Gladys runs on a systemd host with the system DBus socket
// available (standard Raspberry Pi / Debian install, container started with
// --privileged and /var/run/dbus mounted). `boolean:false` = non-interactive,
// so no polkit prompt is expected (Gladys usually runs as root).
const REBOOT_COMMAND =
  'dbus-send --system --print-reply --dest=org.freedesktop.login1 ' +
  '/org/freedesktop/login1 org.freedesktop.login1.Manager.Reboot boolean:false';

// Bound the DBus call: if the socket or systemd-logind is unavailable the
// command could otherwise hang forever. On timeout the child is killed and the
// promise rejects, so the caller gets a bounded failure.
const COMMAND_TIMEOUT_MS = 10000;

/**
 * @description Reboot the host machine through systemd-logind (DBus).
 * @returns {Promise} Resolve when the reboot command was sent.
 * @example
 * await system.rebootHost();
 */
async function rebootHost() {
  logger.info('System: rebooting host through systemd-logind');
  await execAsync(REBOOT_COMMAND, { timeout: COMMAND_TIMEOUT_MS });
}

module.exports = {
  rebootHost,
};
