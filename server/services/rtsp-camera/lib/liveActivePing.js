const { NotFoundError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

/**
 * @description Send a ping to tell Gladys the live is still active.
 * @param {string} cameraSelector - The camera still active.
 * @example
 * liveActivePing(cameraSelector);
 */
async function liveActivePing(cameraSelector) {
  logger.debug(`Camera streaming: Received active ping for camera ${cameraSelector}`);
  const liveStream = this.liveStreams.get(cameraSelector);
  if (!liveStream) {
    throw new NotFoundError('Stream not found');
  }
  this.liveStreams.set(cameraSelector, {
    ...liveStream,
    lastPing: Date.now(),
  });
}

module.exports = {
  liveActivePing,
};
