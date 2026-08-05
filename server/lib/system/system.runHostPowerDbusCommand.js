const { promisify } = require('util');
const childProcess = require('child_process');

const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

const execAsync = promisify(childProcess.exec);

const LOGIND_DESTINATION = 'org.freedesktop.login1';
const LOGIND_PATH = '/org/freedesktop/login1';
// The host system DBus socket, bind-mounted read-only INTO THE HELPER container
// by the Docker daemon (Gladys itself does not need it mounted).
const HOST_DBUS_SOCKET_BIND = '/run/dbus:/run/dbus:ro';
// Bound the DBus call so it can never hang forever.
const COMMAND_TIMEOUT_MS = 10000;
// Bound the helper container lifetime: a stuck container would otherwise block
// the capability probe (and the reboot/shutdown call) forever.
const HELPER_TIMEOUT_MS = 15000;
// Non-destructive query methods (take no boolean argument).
const QUERY_METHODS = ['CanReboot', 'CanPowerOff'];

/**
 * @description Build the dbus-send argv for a systemd-logind Manager method.
 * @param {string} method - Reboot | PowerOff | CanReboot | CanPowerOff.
 * @returns {Array} The dbus-send argv.
 * @example
 * buildDbusArgv('Reboot');
 */
function buildDbusArgv(method) {
  const argv = [
    'dbus-send',
    '--system',
    '--print-reply',
    `--dest=${LOGIND_DESTINATION}`,
    LOGIND_PATH,
    `${LOGIND_DESTINATION}.Manager.${method}`,
  ];
  // Action methods (Reboot/PowerOff) take a `boolean:false` (non-interactive)
  // argument; query methods (CanReboot/CanPowerOff) take none.
  if (!QUERY_METHODS.includes(method)) {
    argv.push('boolean:false');
  }
  return argv;
}

/**
 * @description Run the command directly (Gladys runs on the host, not in Docker).
 * @param {string} method - logind Manager method.
 * @returns {Promise<string>} Resolve with the command stdout.
 * @example
 * await runLocal('CanReboot');
 */
async function runLocal(method) {
  const { stdout } = await execAsync(buildDbusArgv(method).join(' '), { timeout: COMMAND_TIMEOUT_MS });
  return stdout;
}

/**
 * @description Run the command in a short-lived helper container launched
 * through the Docker socket. The daemon bind-mounts the HOST system DBus socket
 * into the helper, so we can reach systemd-logind even though the Gladys
 * container itself has no /run/dbus mount. Uses the Gladys image (ships
 * dbus-send) so nothing needs to be pulled.
 * @param {string} method - logind Manager method.
 * @returns {Promise<string>} Resolve with the container output (dbus-send reply).
 * @example
 * await runViaHelperContainer('Reboot');
 */
async function runViaHelperContainer(method) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const { image } = await this.getGladysImage();
  const container = await this.dockerode.createContainer({
    Image: image,
    name: `gladys-host-power-${method.toLowerCase()}-${Date.now()}`,
    Cmd: buildDbusArgv(method),
    HostConfig: {
      Binds: [HOST_DBUS_SOCKET_BIND],
    },
  });
  let output = '';
  let timeout;
  try {
    await container.start();
    const { StatusCode } = await Promise.race([
      container.wait(),
      new Promise((resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Host power helper container timed out after ${HELPER_TIMEOUT_MS}ms`)),
          HELPER_TIMEOUT_MS,
        );
      }),
    ]);
    const logBuffer = await container.logs({ follow: false, stdout: true, stderr: true });
    output = logBuffer.toString('utf8');
    if (StatusCode !== 0) {
      throw new Error(`Host power helper container exited with status ${StatusCode}: ${output}`);
    }
    return output;
  } finally {
    clearTimeout(timeout);
    // AutoRemove is not used (we need the logs after exit), so clean up here. On
    // timeout the container is still running: kill it before removing it.
    await container.kill().catch(() => {});
    await container.remove({ force: true }).catch(() => {});
  }
}

/**
 * @description Ask systemd-logind (over DBus) to run a Manager method, using
 * the detected mechanism (direct on the host, or via a helper container).
 * @param {string} method - Reboot | PowerOff | CanReboot | CanPowerOff.
 * @param {string} mechanism - 'local' | 'docker-helper'.
 * @returns {Promise<string>} Resolve with the raw dbus-send output.
 * @example
 * await system.runHostPowerDbusCommand('Reboot', 'docker-helper');
 */
async function runHostPowerDbusCommand(method, mechanism) {
  logger.info(`System: running host power command ${method} via ${mechanism}`);
  if (mechanism === 'local') {
    return runLocal(method);
  }
  if (mechanism === 'docker-helper') {
    return runViaHelperContainer.call(this, method);
  }
  throw new PlatformNotCompatible('HOST_POWER_MANAGEMENT_NOT_AVAILABLE');
}

module.exports = {
  runHostPowerDbusCommand,
  buildDbusArgv,
};
