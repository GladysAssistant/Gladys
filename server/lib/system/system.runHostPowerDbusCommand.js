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
// The default `docker-default` AppArmor profile carries no dbus rules, and on
// hosts where dbus-daemon enforces AppArmor mediation (Debian 12+,
// Ubuntu 23.10+...) that means default-deny: a confined helper is rejected by
// the bus before it can even complete the DBus handshake. The helper only runs
// a single dbus-send against logind, so it is started unconfined. Docker
// daemons on hosts without AppArmor ignore the option; a daemon that rejects
// it outright is retried without it (see runViaHelperContainer).
const HELPER_SECURITY_OPT = ['apparmor=unconfined'];
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
 * @param {string} method - Method name on the logind Manager interface.
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
 * @param {string} method - Method name on the logind Manager interface.
 * @returns {Promise<string>} Resolve with the container output (dbus-send reply).
 * @example
 * await runViaHelperContainer('Reboot');
 */
async function runViaHelperContainer(method) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  let image;
  try {
    ({ image } = await this.getGladysImage());
  } catch (e) {
    // Surface the real blocker: without an identified Gladys image there is no
    // image to run the helper with, whatever the state of the host DBus.
    throw new Error(`Unable to identify the Gladys container image to run the helper container (${e.message})`);
  }
  const createHelperContainer = async (securityOpt) =>
    this.dockerode.createContainer({
      Image: image,
      name: `gladys-host-power-${method.toLowerCase()}-${Date.now()}`,
      Cmd: buildDbusArgv(method),
      HostConfig: {
        Binds: [HOST_DBUS_SOCKET_BIND],
        ...(securityOpt ? { SecurityOpt: securityOpt } : {}),
      },
    });
  let container;
  try {
    container = await createHelperContainer(HELPER_SECURITY_OPT);
  } catch (e) {
    // Only a daemon that rejects the AppArmor option itself is retried
    // confined; any other creation failure (bad image, dead daemon...) would
    // fail again identically and is surfaced as-is.
    if (!/apparmor|security.?opt/i.test(`${e && e.message}`)) {
      throw e;
    }
    logger.warn(
      `System: Docker rejected the AppArmor security option for the host power helper container, retrying without it: ${e.message}`,
    );
    container = await createHelperContainer(null);
  }
  let output = '';
  let timeout;
  try {
    await container.start();
    // On timeout this promise loses the race but stays pending: swallow a late
    // rejection (e.g. the kill below fails) so it never becomes an unhandled one.
    const waitPromise = container.wait();
    waitPromise.catch(() => {});
    const { StatusCode } = await Promise.race([
      waitPromise,
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
