const fse = require('fs-extra');
const logger = require('../../../utils/logger');

/**
 * @description Stop streaming.
 * @param {string} cameraSelector - The camera to stream.
 * @returns {Promise} Resolve when stream stopped.
 * @example
 * stopStreaming('my-camera');
 */
async function stopStreaming(cameraSelector) {
  const liveStream = this.liveStreams.get(cameraSelector);
  if (!liveStream) {
    return;
  }
  // First, remove the live stream from the Map
  this.liveStreams.delete(cameraSelector);
  const { liveStreamingProcess, fullFolderPath, watchAbortController, isGladysGateway, cameraFolder } = liveStream;
  // Abort the file watcher
  if (watchAbortController.abort) {
    watchAbortController.abort();
  }
  // Kill the ffmpeg process
  try {
    liveStreamingProcess.kill();
  } catch (e) {
    logger.debug(e);
  }
  // Delete the temp folder
  await fse.remove(fullFolderPath);
  // We clear the interval that checks every X seconds if a live is active
  if (this.liveStreams.size === 0 && this.checkIfLiveActiveInterval) {
    clearInterval(this.checkIfLiveActiveInterval);
    this.checkIfLiveActiveInterval = null;
  }
  // if the live is a gateway live, clean camera folder
  if (isGladysGateway) {
    try {
      await this.gladys.gateway.gladysGatewayClient.cameraCleanSession(cameraFolder);
    } catch (e) {
      logger.debug(e);
    }
  }
}

module.exports = {
  stopStreaming,
};
