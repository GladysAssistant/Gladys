/**
 * @description Stop streaming
 * @param {Object} cameraSelector - The camera to stream.
 * @returns {Promise} Resolve when stream stopped.
 * @example
 * stopStreaming('my-camera');
 */
async function stopStreaming(cameraSelector) {
  const liveStreamingProcess = this.liveStreams.get(cameraSelector);
  if (!liveStreamingProcess) {
    throw new Error();
  }
  liveStreamingProcess.kill();
  this.liveStreams.delete(cameraSelector);
}

module.exports = {
  stopStreaming,
};
