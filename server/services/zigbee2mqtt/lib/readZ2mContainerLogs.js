const logger = require('../../../utils/logger');

const KNOWN_ERROR_PATTERNS = [
  {
    code: 'EZSP_PROTOCOL_VERSION',
    test: (line) => line.includes('Adapter EZSP protocol version') && line.includes('is not supported by Host'),
  },
];

/**
 * @description Read Zigbee2mqtt container logs and detect fatal errors.
 * @param {string} containerId - Docker container id.
 * @returns {Promise} Resolve when logs have been read.
 * @example
 * await z2m.readZ2mContainerLogs('abc123');
 */
async function readZ2mContainerLogs(containerId) {
  try {
    const stream = await this.gladys.system.getContainerLogs(containerId);
    await new Promise((resolve) => {
      let leftover = '';
      let knownError = null;
      let lastRawError = null;
      let resolved = false;

      const processLine = (line) => {
        // Strip Docker multiplexing control characters, preserving newlines (\x0A)
        const cleanLine = line.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ');
        if (knownError === null) {
          const matchedPattern = KNOWN_ERROR_PATTERNS.find((pattern) => pattern.test(cleanLine));
          if (matchedPattern) {
            logger.warn(`Zigbee2mqtt: known error detected in container logs: ${matchedPattern.code}`);
            knownError = { code: matchedPattern.code, message: null };
            return true;
          }
        }
        if (/error:/i.test(cleanLine)) {
          lastRawError = cleanLine.trim();
        }
        return false;
      };

      const finish = () => {
        if (resolved) {
          return;
        }
        resolved = true;
        if (leftover) {
          processLine(leftover);
        }
        if (typeof stream.destroy === 'function') {
          stream.destroy();
        }
        if (knownError !== null) {
          this.z2mContainerError = knownError;
        } else if (lastRawError !== null) {
          this.z2mContainerError = { code: null, message: lastRawError };
        } else {
          this.z2mContainerError = null;
        }
        resolve();
      };

      const timeout = setTimeout(finish, 10000);

      stream.on('data', (chunk) => {
        const combined = leftover + chunk.toString();
        const parts = combined.split('\n');
        leftover = parts[parts.length - 1];
        for (let i = 0; i < parts.length - 1; i += 1) {
          if (processLine(parts[i])) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              if (typeof stream.destroy === 'function') {
                stream.destroy();
              }
              this.z2mContainerError = knownError;
              resolve();
            }
            return;
          }
        }
      });

      stream.on('end', () => {
        clearTimeout(timeout);
        finish();
      });

      stream.on('error', () => {
        clearTimeout(timeout);
        finish();
      });
    });
  } catch (e) {
    logger.warn(`Zigbee2mqtt: failed to read container logs: ${e.message}`);
    this.z2mContainerError = null;
  }

  this.emitStatusEvent();
}

module.exports = {
  readZ2mContainerLogs,
};
