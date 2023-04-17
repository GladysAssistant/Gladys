const fse = require('fs-extra');
const logger = require('../../../utils/logger');

const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Stop streaming
 * @param {Object} cameraSelector - The camera to stream.
 * @returns {Promise} Resolve when stream stopped.
 * @example
 * stopStreaming('my-camera');
 */
async function stopStreaming(cameraSelector) {
  const liveStream = this.liveStreams.get(cameraSelector);
  if (!liveStream) {
    throw new NotFoundError('STREAM_NOT_FOUND');
  }
  // First, remove the live stream from the Map
  this.liveStreams.delete(cameraSelector);
  const { liveStreamingProcess, fullFolderPath, watchAbortController } = liveStream;
  // Abort the file watcher
  watchAbortController.abort();
  // Kill the ffmpeg process
  try {
    liveStreamingProcess.kill();
  } catch (e) {
    logger.debug(e);
  }
  // Delete the temp folder
  try {
    await fse.remove(fullFolderPath);
  } catch (e) {
    logger.debug(e);
  }
  // We clear the interval that checks every X seconds if a live is active
  if (this.liveStreams.size === 0 && this.checkIfLiveActiveInterval) {
    clearInterval(this.checkIfLiveActiveInterval);
    this.checkIfLiveActiveInterval = null;
  }
}

module.exports = {
  stopStreaming,
};
