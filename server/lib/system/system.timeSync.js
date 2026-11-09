const fs = require('fs');

const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { DBUS_SYSTEM_SOCKETS, DBUS_SEND_BINARIES } = require('./system.detectHostPowerManagement');

const TIMEDATE_DESTINATION = 'org.freedesktop.timedate1';
const TIMEDATE_PATH = '/org/freedesktop/timedate1';
// Every read through the Docker helper spins up a short-lived container: the
// answer is kept this long, so the System settings page (and its reloads)
// never turns into a helper-container factory.
const TIME_SYNC_STATUS_CACHE_MS = 60 * 1000;

const UNAVAILABLE_STATUS = Object.freeze({
  available: false,
  can_ntp: false,
  ntp_enabled: false,
  ntp_synchronized: false,
});

/**
 * @description Build the dbus-send argv reading all the systemd-timedated properties.
 * @returns {Array<string>} The dbus-send argv.
 * @example
 * buildTimeSyncStatusArgv();
 */
function buildTimeSyncStatusArgv() {
  return [
    'dbus-send',
    '--system',
    '--print-reply',
    `--dest=${TIMEDATE_DESTINATION}`,
    TIMEDATE_PATH,
    'org.freedesktop.DBus.Properties.GetAll',
    `string:${TIMEDATE_DESTINATION}`,
  ];
}

/**
 * @description Build the dbus-send argv turning on the network time
 * synchronization of the host (`timedatectl set-ntp true`), non-interactive.
 * @returns {Array<string>} The dbus-send argv.
 * @example
 * buildEnableTimeSyncArgv();
 */
function buildEnableTimeSyncArgv() {
  return [
    'dbus-send',
    '--system',
    '--print-reply',
    `--dest=${TIMEDATE_DESTINATION}`,
    TIMEDATE_PATH,
    `${TIMEDATE_DESTINATION}.SetNTP`,
    'boolean:true',
    'boolean:false',
  ];
}

/**
 * @description Read a boolean property in a `dbus-send --print-reply` output of
 * Properties.GetAll, which prints each property as
 * `string "NTP"` followed by `variant boolean true`.
 * @param {string} output - Sanitized dbus-send output.
 * @param {string} name - Property name.
 * @returns {boolean|null} The property value, or null when absent.
 * @example
 * readBooleanProperty(output, 'NTPSynchronized');
 */
function readBooleanProperty(output, name) {
  const match = new RegExp(`string\\s+"${name}"\\s+variant\\s+boolean\\s+(true|false)`).exec(output);
  return match ? match[1] === 'true' : null;
}

/**
 * @description Parse the systemd-timedated properties out of a dbus-send
 * output. Docker log frames add binary headers, so non-printable bytes are
 * stripped first.
 * @param {string} output - Raw dbus-send output.
 * @returns {object|null} `{ can_ntp, ntp_enabled, ntp_synchronized }`, or null
 * when the output is not a timedated answer.
 * @example
 * parseTimeSyncStatus('   dict entry(\n string "NTP"\n variant boolean true\n )');
 */
function parseTimeSyncStatus(output) {
  // eslint-disable-next-line no-control-regex
  const sanitized = `${output || ''}`.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ');
  const ntpEnabled = readBooleanProperty(sanitized, 'NTP');
  const ntpSynchronized = readBooleanProperty(sanitized, 'NTPSynchronized');
  if (ntpEnabled === null || ntpSynchronized === null) {
    return null;
  }
  const canNtp = readBooleanProperty(sanitized, 'CanNTP');
  return {
    // an old timedated without CanNTP: NTP being on proves there is a service
    can_ntp: canNtp === null ? ntpEnabled : canNtp,
    ntp_enabled: ntpEnabled,
    ntp_synchronized: ntpSynchronized,
  };
}

/**
 * @description The ways Gladys may reach the host system bus, cheapest first:
 * directly (bare-metal, or a container mounting /run/dbus), then through a
 * Docker helper container. The mechanism that answered last time comes first.
 * @param {object} system - The System instance.
 * @returns {Array<string>} The mechanisms to try, in order.
 * @example
 * getCandidateMechanisms(system);
 */
function getCandidateMechanisms(system) {
  const mechanisms = [];
  const hasLocalBinary = DBUS_SEND_BINARIES.some((binaryPath) => fs.existsSync(binaryPath));
  const hasLocalSocket = DBUS_SYSTEM_SOCKETS.some((socketPath) => fs.existsSync(socketPath));
  if (hasLocalBinary && hasLocalSocket) {
    mechanisms.push('local');
  }
  if (system.dockerode) {
    mechanisms.push('docker-helper');
  }
  if (system.timeSyncMechanism && mechanisms.includes(system.timeSyncMechanism)) {
    return [system.timeSyncMechanism, ...mechanisms.filter((mechanism) => mechanism !== system.timeSyncMechanism)];
  }
  return mechanisms;
}

/**
 * @description Ask systemd-timedated on the host whether the clock is kept on
 * time by a network time service.
 * @returns {Promise<object>} The status.
 * @example
 * await readTimeSyncStatus.call(system);
 */
async function readTimeSyncStatus() {
  if (process.platform !== 'linux') {
    return { ...UNAVAILABLE_STATUS };
  }
  const mechanisms = getCandidateMechanisms(this);
  // sequential on purpose: the next mechanism is only worth a try (and a
  // helper container) when the previous one could not answer
  // eslint-disable-next-line no-restricted-syntax
  for (const mechanism of mechanisms) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const output = await this.runHostDbusCommand(buildTimeSyncStatusArgv(), mechanism, 'time-sync-status');
      const status = parseTimeSyncStatus(output);
      if (status) {
        this.timeSyncMechanism = mechanism;
        return { available: true, ...status };
      }
      logger.debug(`System: unexpected systemd-timedated answer via ${mechanism}: ${output}`);
    } catch (e) {
      logger.debug(`System: systemd-timedated not reachable via ${mechanism}: ${e.message}`);
    }
  }
  this.timeSyncMechanism = null;
  return { ...UNAVAILABLE_STATUS };
}

/**
 * @description Tell whether the clock of the machine running Gladys is kept on
 * time by a network time service (NTP), as reported by systemd-timedated on
 * the host. A wrong clock breaks scheduled scenes, history and energy
 * computations: the System settings page uses this to explain why the clock
 * is off and how to fix it. The answer is cached for a minute and concurrent
 * callers share one read.
 * @returns {Promise<object>} `{ available, can_ntp, ntp_enabled, ntp_synchronized }`.
 * @example
 * await system.getTimeSyncStatus();
 */
async function getTimeSyncStatus() {
  const fresh = this.timeSyncStatusReadAt && Date.now() - this.timeSyncStatusReadAt < TIME_SYNC_STATUS_CACHE_MS;
  if (this.timeSyncStatus && fresh) {
    return this.timeSyncStatus;
  }
  if (this.timeSyncStatusInFlight) {
    return this.timeSyncStatusInFlight;
  }
  const read = (async () => {
    try {
      const status = await readTimeSyncStatus.call(this);
      this.timeSyncStatus = status;
      this.timeSyncStatusReadAt = Date.now();
      return status;
    } finally {
      this.timeSyncStatusInFlight = null;
    }
  })();
  this.timeSyncStatusInFlight = read;
  return read;
}

/**
 * @description Turn on the network time synchronization of the host
 * (equivalent of `timedatectl set-ntp true`), then return the new status.
 * @returns {Promise<object>} The time synchronization status after the change.
 * @example
 * await system.enableTimeSync();
 */
async function enableTimeSync() {
  const status = await this.getTimeSyncStatus();
  if (!status.available) {
    throw new PlatformNotCompatible('TIME_SYNC_NOT_AVAILABLE');
  }
  if (!status.can_ntp) {
    throw new PlatformNotCompatible('TIME_SYNC_NO_NTP_SERVICE');
  }
  logger.info(`System: enabling the network time synchronization of the host (via ${this.timeSyncMechanism})`);
  await this.runHostDbusCommand(buildEnableTimeSyncArgv(), this.timeSyncMechanism, 'time-sync-enable');
  this.timeSyncStatus = null;
  this.timeSyncStatusReadAt = null;
  return this.getTimeSyncStatus();
}

module.exports = {
  getTimeSyncStatus,
  enableTimeSync,
  parseTimeSyncStatus,
  buildTimeSyncStatusArgv,
  buildEnableTimeSyncArgv,
  TIME_SYNC_STATUS_CACHE_MS,
};
