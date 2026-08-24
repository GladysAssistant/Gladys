const fs = require('fs');

const logger = require('../../utils/logger');

// systemd system DBus socket, standard locations (checked on the Gladys FS).
const DBUS_SYSTEM_SOCKETS = ['/run/dbus/system_bus_socket', '/var/run/dbus/system_bus_socket'];
// dbus-send client binary, standard locations.
const DBUS_SEND_BINARIES = ['/usr/bin/dbus-send', '/bin/dbus-send'];
// A failed detection is retried (through redetectHostPowerManagement) at most
// this often: each retry may spin up short-lived helper containers.
const HOST_POWER_REDETECTION_THROTTLE_MS = 60 * 1000;

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
 * @description Probe, via the given mechanism, whether the host allows reboot
 * and power-off (two non-destructive logind queries: CanReboot / CanPowerOff).
 * @param {object} system - The System instance (for runHostPowerDbusCommand).
 * @param {string} mechanism - 'local' | 'docker-helper'.
 * @returns {Promise<object|null>} `{ reboot, shutdown }`, or null if the path
 * cannot reach logind at all.
 * @example
 * await probeHostPowerCapabilities(system, 'docker-helper');
 */
async function probeHostPowerCapabilities(system, mechanism) {
  let rebootReply;
  try {
    // If this first call throws, the path cannot reach logind (no socket, no
    // Docker, etc.) — report the whole path as unusable.
    rebootReply = await system.runHostPowerDbusCommand('CanReboot', mechanism);
  } catch (e) {
    // Logged with the underlying reason: this is the message a user needs to
    // understand why the reboot/shutdown buttons are unavailable.
    logger.warn(`System: host power management not reachable via ${mechanism}: ${e.message}`);
    logger.debug(e);
    return null;
  }
  let powerOffReply = null;
  try {
    powerOffReply = await system.runHostPowerDbusCommand('CanPowerOff', mechanism);
  } catch (e) {
    // Reachable for reboot but the power-off probe failed: keep reboot, drop shutdown.
    logger.warn(`System: host power-off probe failed via ${mechanism}: ${e.message}`);
    logger.debug(e);
  }
  return {
    reboot: replyMeansAvailable(parseCanReply(rebootReply)),
    shutdown: replyMeansAvailable(parseCanReply(powerOffReply)),
  };
}

/**
 * @description The actual detection logic, always run through
 * detectHostPowerManagement() so concurrent callers share one run.
 * @returns {Promise<string|null>} Resolve with the mechanism or null.
 * @example
 * await runDetection.call(system);
 */
async function runDetection() {
  this.hostPowerCapabilities = { reboot: false, shutdown: false };
  if (process.platform !== 'linux') {
    this.hostPowerManagement = null;
    return null;
  }

  // A path is retained as soon as it can reach logind AND at least one action is
  // allowed. Local first (cheap, no container), then the Docker helper.
  const tryMechanism = async (mechanism) => {
    const capabilities = await probeHostPowerCapabilities(this, mechanism);
    if (capabilities && (capabilities.reboot || capabilities.shutdown)) {
      this.hostPowerManagement = mechanism;
      this.hostPowerCapabilities = capabilities;
      return true;
    }
    return false;
  };

  // Local: Gladys reaches the host DBus socket directly (bare-metal, or a
  // container that mounts it). The FS check is only a pre-filter.
  const hasLocalBinary = DBUS_SEND_BINARIES.some((binaryPath) => fs.existsSync(binaryPath));
  const hasLocalSocket = DBUS_SYSTEM_SOCKETS.some((socketPath) => fs.existsSync(socketPath));
  if (hasLocalBinary && hasLocalSocket && (await tryMechanism('local'))) {
    return 'local';
  }

  // Docker helper: act through a short-lived helper container via the socket.
  if (this.dockerode && (await tryMechanism('docker-helper'))) {
    return 'docker-helper';
  }

  this.hostPowerManagement = null;
  return null;
}

/**
 * @description Detect (and cache on the instance) how the host can be
 * rebooted/powered off: `'local'` (Gladys reaches /run/dbus directly),
 * `'docker-helper'` (via a helper container through the Docker socket), or
 * `null` (not possible). Each candidate path confirms with non-destructive
 * CanReboot / CanPowerOff probes; per-action availability is cached in
 * `this.hostPowerCapabilities` and the chosen mechanism in
 * `this.hostPowerManagement`. Concurrent calls (init, a user click, the
 * settings page retry) share a single in-flight detection.
 * @returns {Promise<string|null>} Resolve with the mechanism or null.
 * @example
 * await system.detectHostPowerManagement();
 */
async function detectHostPowerManagement() {
  if (this.hostPowerDetectionInFlight) {
    return this.hostPowerDetectionInFlight;
  }
  const detection = (async () => {
    try {
      return await runDetection.call(this);
    } finally {
      this.hostPowerLastDetectionAt = Date.now();
      this.hostPowerDetectionInFlight = null;
    }
  })();
  this.hostPowerDetectionInFlight = detection;
  return detection;
}

/**
 * @description Re-run the detection when the previous one found nothing, at
 * most once per throttle window. The detection at init can fail transiently
 * (on host boot Gladys often starts before DBus, or before the Docker daemon
 * is fully ready): retrying when the availability is actually read lets the
 * feature recover without a Gladys restart.
 * @returns {Promise<string|null>} Resolve with the mechanism or null.
 * @example
 * await system.redetectHostPowerManagement();
 */
async function redetectHostPowerManagement() {
  if (this.hostPowerManagement) {
    return this.hostPowerManagement;
  }
  if (this.hostPowerDetectionInFlight) {
    return this.hostPowerDetectionInFlight;
  }
  const throttled =
    this.hostPowerLastDetectionAt && Date.now() - this.hostPowerLastDetectionAt < HOST_POWER_REDETECTION_THROTTLE_MS;
  if (throttled) {
    return null;
  }
  return this.detectHostPowerManagement();
}

module.exports = {
  detectHostPowerManagement,
  redetectHostPowerManagement,
  probeHostPowerCapabilities,
  parseCanReply,
  replyMeansAvailable,
  HOST_POWER_REDETECTION_THROTTLE_MS,
};
