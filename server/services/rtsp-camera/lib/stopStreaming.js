const fse = require('fs-extra');

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
  const { liveStreamingProcess, fullFolderPath, watchAbortController } = liveStream;
  liveStreamingProcess.kill();
  watchAbortController.abort();
  await fse.remove(fullFolderPath);
  this.liveStreams.delete(cameraSelector);
}

module.exports = {
  stopStreaming,
};
