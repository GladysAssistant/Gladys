const logger = require('../../../utils/logger');

/**
 * @description Check if a live is active
 * @example
 * checkIfLiveActive();
 */
async function checkIfLiveActive() {
  logger.debug(`Camera streaming: Checking if live is still active`);
  this.liveStreams.forEach((liveStream, cameraSelector) => {
    const { lastPing } = liveStream;
    // if last ping was more than 10 seconds ago
    if (lastPing < Date.now() - 10 * 1000) {
      logger.debug(`Camera streaming: Live ${cameraSelector} not active, stopping live`);
      this.stopStreaming(cameraSelector);
    }
  });
}

module.exports = {
  checkIfLiveActive,
};
