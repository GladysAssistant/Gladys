const logger = require('../../../utils/logger');

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
    const logText = await new Promise((resolve, reject) => {
      const chunks = [];
      const timeout = setTimeout(() => {
        resolve(chunks.join(''));
      }, 10000); // 10 second timeout
      stream.on('data', (chunk) => {
        chunks.push(chunk.toString());
      });
      stream.on('end', () => {
        clearTimeout(timeout);
        resolve(chunks.join(''));
      });
      stream.on('error', () => {
        clearTimeout(timeout);
        resolve(chunks.join(''));
      });
    });

    // Strip Docker multiplexing control characters
    const cleanedLog = logText.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');

    if (cleanedLog.includes('Adapter EZSP protocol version') && cleanedLog.includes('is not supported by Host')) {
      logger.warn('Zigbee2mqtt: EZSP protocol version error detected in container logs');
      this.z2mContainerError = 'EZSP_PROTOCOL_VERSION';
    } else {
      this.z2mContainerError = null;
    }
  } catch (e) {
    logger.warn(`Zigbee2mqtt: failed to read container logs: ${e.message}`);
    this.z2mContainerError = null;
  }

  this.emitStatusEvent();
}

module.exports = {
  readZ2mContainerLogs,
};
