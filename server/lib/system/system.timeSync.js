const fs = require('fs');
const { performance } = require('perf_hooks');

const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { DBUS_SYSTEM_SOCKETS, DBUS_SEND_BINARIES } = require('./system.detectHostPowerManagement');

const TIMEDATE_DESTINATION = 'org.freedesktop.timedate1';
const TIMEDATE_PATH = '/org/freedesktop/timedate1';
// Every read through the Docker helper spins up a short-lived container: the
// answer is kept this long, so the System settings page (and its reloads)
// never turns into a helper-container factory. Its age is measured on the
// monotonic clock: this feature exists because the wall clock can jump.
const TIME_SYNC_STATUS_CACHE_MS = 60 * 1000;
// SetNTP only queues the start of the time service, and timedated answers that
// NTP is on as long as that start is pending: the status is only worth reading
// once the service had the time to start, or to fail to.
const TIME_SYNC_SETTLE_MS = 2 * 1000;

const SYSTEMD_DESTINATION = 'org.freedesktop.systemd1';
const SYSTEMD_PATH = '/org/freedesktop/systemd1';
// The containers systemd knows of (systemd-detect-virt --list), all sharing the
// kernel, hence the clock, of the machine hosting them: the time service of that
// machine keeps the clock on time, not the one of the container (there,
// systemd-timesyncd skips its own start). "wsl" is left out on purpose: WSL 2
// runs its own kernel, with its own clock.
const CONTAINER_VIRTUALIZATIONS = [
  'systemd-nspawn',
  'lxc-libvirt',
  'lxc',
  'openvz',
  'docker',
  'podman',
  'rkt',
  'proot',
  'pouch',
  'container-other',
];

const UNAVAILABLE_STATUS = Object.freeze({
  available: false,
  can_ntp: false,
  ntp_enabled: false,
  ntp_synchronized: false,
  in_container: false,
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
 * @description Build the dbus-send argv asking systemd, on the host, which
 * virtualization it runs in (`systemd-detect-virt`).
 * @returns {Array<string>} The dbus-send argv.
 * @example
 * buildVirtualizationArgv();
 */
function buildVirtualizationArgv() {
  return [
    'dbus-send',
    '--system',
    '--print-reply',
    `--dest=${SYSTEMD_DESTINATION}`,
    SYSTEMD_PATH,
    'org.freedesktop.DBus.Properties.Get',
    `string:${SYSTEMD_DESTINATION}.Manager`,
    'string:Virtualization',
  ];
}

/**
 * @description Docker log frames add binary headers to a dbus-send output:
 * replace its non-printable bytes.
 * @param {string} output - Raw dbus-send output.
 * @returns {string} The printable output.
 * @example
 * sanitizeOutput('   variant       string "lxc"');
 */
function sanitizeOutput(output) {
  // eslint-disable-next-line no-control-regex
  return `${output || ''}`.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ');
}

/**
 * @description Parse the virtualization systemd runs in out of a dbus-send
 * output: empty on bare-metal, "kvm" in a virtual machine, "lxc" in a container...
 * @param {string} output - Raw dbus-send output.
 * @returns {string|null} The virtualization, or null when the output is not an
 * answer of systemd.
 * @example
 * parseVirtualization('   variant       string "lxc"');
 */
function parseVirtualization(output) {
  const match = /variant\s+string\s+"([^"]*)"/.exec(sanitizeOutput(output));
  return match ? match[1] : null;
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
 * output.
 * @param {string} output - Raw dbus-send output.
 * @returns {object|null} `{ can_ntp, ntp_enabled, ntp_synchronized }`, or null
 * when the output is not a timedated answer.
 * @example
 * parseTimeSyncStatus('   dict entry(\n string "NTP"\n variant boolean true\n )');
 */
function parseTimeSyncStatus(output) {
  const sanitized = sanitizeOutput(output);
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
 * @description Tell whether the host is known to be a container, from what was
 * already read of it, without asking anything.
 * @param {object} system - The System instance.
 * @returns {boolean} True if the host is known to be a container.
 * @example
 * isKnownContainer(system);
 */
function isKnownContainer(system) {
  return CONTAINER_VIRTUALIZATIONS.includes(system.hostVirtualization);
}

/**
 * @description Tell whether the host is itself a container (Docker in a Proxmox
 * LXC, for example). It never changes while Gladys runs: it is asked once, and
 * asked again only while it could not be read.
 * @param {string} mechanism - The mechanism that reached the host system bus.
 * @returns {Promise<boolean>} True if the host is a container.
 * @example
 * await isHostContainer.call(system, 'docker-helper');
 */
async function isHostContainer(mechanism) {
  if (this.hostVirtualization === null || this.hostVirtualization === undefined) {
    try {
      const output = await this.runHostDbusCommand(buildVirtualizationArgv(), mechanism, 'host-virtualization');
      this.hostVirtualization = parseVirtualization(output);
    } catch (e) {
      logger.debug(`System: unable to read the virtualization of the host via ${mechanism}: ${e.message}`);
    }
  }
  return isKnownContainer(this);
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
        // only worth a second question (and a helper container) when no time
        // service of the host plainly keeps the clock on time; otherwise what
        // is already known of the host is still reported
        const keptOnTime = status.ntp_enabled && status.ntp_synchronized;
        // eslint-disable-next-line no-await-in-loop
        const inContainer = keptOnTime ? isKnownContainer(this) : await isHostContainer.call(this, mechanism);
        return { available: true, ...status, in_container: inContainer };
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
 * is off and how to fix it. The answer is cached for a minute, unless a
 * refresh is asked (the "Check again" button), and concurrent callers share
 * one read.
 * @param {object} [options] - Options.
 * @param {boolean} [options.refresh] - Read the status again, even when cached
 * or while a read is in flight.
 * @returns {Promise<object>} `{ available, can_ntp, ntp_enabled, ntp_synchronized, in_container }`.
 * @example
 * await system.getTimeSyncStatus({ refresh: true });
 */
async function getTimeSyncStatus({ refresh = false } = {}) {
  const fresh =
    this.timeSyncStatusReadAt !== null &&
    this.timeSyncStatusReadAt !== undefined &&
    performance.now() - this.timeSyncStatusReadAt < TIME_SYNC_STATUS_CACHE_MS;
  if (this.timeSyncStatus && fresh && !refresh) {
    return this.timeSyncStatus;
  }
  if (this.timeSyncStatusInFlight && refresh) {
    // a refresh asks for a status read after the request: a read already in
    // flight may predate a change (the time synchronization just turned on)
    await this.timeSyncStatusInFlight;
  }
  // without a refresh, or started while this refresh was waiting
  if (this.timeSyncStatusInFlight) {
    return this.timeSyncStatusInFlight;
  }
  const read = (async () => {
    try {
      const status = await readTimeSyncStatus.call(this);
      this.timeSyncStatus = status;
      this.timeSyncStatusReadAt = performance.now();
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
 * (equivalent of `timedatectl set-ntp true`), then return the new status. The
 * host accepting the request does not mean its time service started: the
 * returned status tells (`ntp_enabled`).
 * @returns {Promise<object>} The time synchronization status after the change.
 * @example
 * await system.enableTimeSync();
 */
async function enableTimeSync() {
  const status = await this.getTimeSyncStatus();
  if (!status.available) {
    throw new PlatformNotCompatible('TIME_SYNC_NOT_AVAILABLE');
  }
  // the status of a host kept on time does not ask whether it is a container:
  // asked here before any change (once per process, then known)
  if (status.in_container || (await isHostContainer.call(this, this.timeSyncMechanism))) {
    throw new PlatformNotCompatible('TIME_SYNC_IN_CONTAINER');
  }
  if (!status.can_ntp) {
    throw new PlatformNotCompatible('TIME_SYNC_NO_NTP_SERVICE');
  }
  logger.info(`System: enabling the network time synchronization of the host (via ${this.timeSyncMechanism})`);
  await this.runHostDbusCommand(buildEnableTimeSyncArgv(), this.timeSyncMechanism, 'time-sync-enable');
  this.timeSyncStatus = null;
  this.timeSyncStatusReadAt = null;
  await new Promise((resolve) => {
    setTimeout(resolve, TIME_SYNC_SETTLE_MS);
  });
  // a refresh never returns a read started before the change
  const newStatus = await this.getTimeSyncStatus({ refresh: true });
  if (!newStatus.ntp_enabled) {
    logger.warn(
      'System: the host accepted to turn on its network time synchronization, but its service is not running',
    );
  }
  return newStatus;
}

module.exports = {
  getTimeSyncStatus,
  enableTimeSync,
  parseTimeSyncStatus,
  parseVirtualization,
  buildTimeSyncStatusArgv,
  buildEnableTimeSyncArgv,
  buildVirtualizationArgv,
  TIME_SYNC_STATUS_CACHE_MS,
  TIME_SYNC_SETTLE_MS,
};
