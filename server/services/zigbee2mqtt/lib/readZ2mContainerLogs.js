const logger = require('../../../utils/logger');

// Errors of the coordinator drivers (zigbee-herdsman 10.10, in Zigbee2mqtt 2.14) when the coordinator does not
// answer: a model other than the selected one (so another driver), a dongle used by another software, a frozen dongle
const ADAPTER_NO_RESPONSE_MESSAGES = [
  'Failed to connect to the adapter', // zstack
  'Failed to start EZSP layer', // ember, with status=HOST_FATAL_ERROR
  'Failure to connect', // ezsp
  'failed to start adapter connection to firmware', // deconz
];

// The ember driver refuses the firmware of the dongle, "Adapter EZSP protocol version (12) is not supported by Host
// [13-19]."
const EZSP_PROTOCOL_VERSION_REGEX = /Adapter EZSP protocol version \((\d+)\) is not supported by Host \[(\d+)-\d+\]/;

// The first matching line explains why Zigbee2mqtt does not start, its code selects the message shown to the user
const KNOWN_ERROR_PATTERNS = [
  {
    // Only a firmware older than the ember driver supports (EmberZNet before 7.4): the legacy ezsp driver runs it.
    // A newer one is refused by both drivers, its raw error is shown.
    code: 'EZSP_PROTOCOL_VERSION',
    test: (line) => {
      const match = line.match(EZSP_PROTOCOL_VERSION_REGEX);
      return match !== null && Number(match[1]) < Number(match[2]);
    },
  },
  {
    // A network coordinator out of reach, logged by its driver (namespace "zh:") before the driver gives up. Not by
    // the MQTT client of Zigbee2mqtt, whose errors on the broker look the same
    code: 'ADAPTER_UNREACHABLE',
    test: (line) =>
      line.includes(' zh:') &&
      /connect (ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|ETIMEDOUT)|getaddrinfo (ENOTFOUND|EAI_AGAIN)/.test(line),
  },
  {
    code: 'ADAPTER_NO_RESPONSE',
    test: (line) => ADAPTER_NO_RESPONSE_MESSAGES.some((message) => line.includes(message)),
  },
  {
    // Zigbee2mqtt then waits on its failure page without exiting. The invalid settings follow, one per line
    code: 'INVALID_CONFIGURATION',
    test: (line) => line.includes('Refusing to start because configuration is not valid'),
  },
];

// Errors logged before this line did not prevent Zigbee2mqtt from starting, like a device failing to answer
const STARTED_LINE = 'Zigbee2MQTT started!';
// Line of an error logged by Zigbee2mqtt, "[2026-11-06 18:53:42] error: \tz2m: Error: Error while opening socket"
const LOGGED_ERROR = /\] error:\s+(.+)$/;
// Zigbee2mqtt starts, or fails, within a minute or two (the drivers try for 20 to 30 s), longer on a modest machine
const LOGS_READING_TIMEOUT_IN_MS = 5 * 60 * 1000;

/**
 * @description Read Zigbee2mqtt container logs until Zigbee2mqtt starts or tells why it does not.
 * @param {string} containerId - Docker container id.
 * @param {number} since - When the container was restarted, as a UNIX timestamp in seconds: Docker keeps the logs
 * of every run of a container, the older ones come from a previous run.
 * @returns {Promise} Resolve when logs have been read.
 * @example
 * await z2m.readZ2mContainerLogs('abc123', 1700000000);
 */
async function readZ2mContainerLogs(containerId, since) {
  try {
    // The stream ends when the container stops, as Zigbee2mqtt does when it fails to start. Every line since the
    // restart: the cause can be followed by hundreds of lines, like the stream dump of zstack failing to open a socket
    const stream = await this.gladys.system.getContainerLogs(containerId, { follow: true, since, tail: 'all' });
    await new Promise((resolve) => {
      let leftover = '';
      let started = false;
      let knownError = null;
      // The settings refused by Zigbee2mqtt are listed until its advice to read the documentation
      let readingInvalidSettings = false;
      let lastLoggedError = null;
      let resolved = false;
      let timeout = null;

      const processLine = (line) => {
        // Remove Docker stream prefix byte, strip ANSI color codes, then remaining control chars
        const cleanLine = line
          .slice(1)
          .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')
          .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ');
        if (readingInvalidSettings) {
          const invalidSetting = /- (.+)$/.exec(cleanLine);
          if (invalidSetting) {
            knownError.message = [knownError.message, invalidSetting[1].trim()].filter(Boolean).join('; ');
          } else if (cleanLine.includes("If you don't know how to solve this")) {
            readingInvalidSettings = false;
          }
          return;
        }
        if (cleanLine.includes(STARTED_LINE)) {
          started = true;
          return;
        }
        const matchedPattern = KNOWN_ERROR_PATTERNS.find((pattern) => pattern.test(cleanLine));
        if (matchedPattern) {
          logger.warn(`Zigbee2mqtt: known error detected in container logs: ${matchedPattern.code}`);
          knownError = { code: matchedPattern.code, message: null };
          readingInvalidSettings = matchedPattern.code === 'INVALID_CONFIGURATION';
          return;
        }
        const loggedError = LOGGED_ERROR.exec(cleanLine);
        if (loggedError) {
          lastLoggedError = loggedError[1].trim();
        }
      };

      const done = () => started || (knownError !== null && !readingInvalidSettings);

      const finish = () => {
        if (resolved) {
          return;
        }
        resolved = true;
        clearTimeout(timeout);
        if (leftover && !done()) {
          processLine(leftover);
        }
        if (typeof stream.destroy === 'function') {
          stream.destroy();
        }
        if (started || this.zigbee2mqttConnected) {
          // Zigbee2mqtt runs: whatever was logged did not prevent it from starting
          this.z2mContainerError = null;
        } else if (knownError !== null) {
          this.z2mContainerError = knownError;
        } else if (lastLoggedError !== null) {
          this.z2mContainerError = { code: null, message: lastLoggedError };
        } else {
          this.z2mContainerError = null;
        }
        resolve();
      };

      timeout = setTimeout(finish, LOGS_READING_TIMEOUT_IN_MS);

      stream.on('data', (chunk) => {
        if (resolved) {
          return;
        }
        const parts = (leftover + chunk.toString()).split('\n');
        leftover = parts.pop();
        const stop = parts.some((part) => {
          processLine(part);
          return done();
        });
        if (stop) {
          leftover = '';
          finish();
        }
      });

      stream.on('end', finish);

      stream.on('error', finish);
    });
  } catch (e) {
    logger.warn(`Zigbee2mqtt: failed to read container logs: ${e.message}`);
    this.z2mContainerError = null;
  }

  if (this.z2mContainerError && this.z2mContainerError.code === 'EZSP_PROTOCOL_VERSION') {
    await this.fallbackToEzsp();
  }

  this.emitStatusEvent();
}

module.exports = {
  readZ2mContainerLogs,
};
