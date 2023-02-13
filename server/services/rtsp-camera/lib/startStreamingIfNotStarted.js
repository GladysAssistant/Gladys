const Promise = require('bluebird');

/**
 * @description Start streaming
 * @param {Object} cameraSelector - The camera to stream.
 * @param {string} backendUrl - URL of the backend
 * @returns {Promise} Resolve when stream started.
 * @example
 * startStreaming(device);
 */
async function startStreamingIfNotStarted(cameraSelector, backendUrl) {
  const liveStreamingStarted = this.liveStreamsStarting.get(cameraSelector);
  if (liveStreamingStarted) {
    await liveStreamingStarted;
  }
  const liveStreamStartingPromise = this.startStreaming(cameraSelector, backendUrl);
  this.liveStreamsStarting.set(cameraSelector, liveStreamStartingPromise);
  try {
    const result = await liveStreamStartingPromise;
    this.liveStreamsStarting.delete(cameraSelector);
    return result;
  } catch (e) {
    this.liveStreamsStarting.delete(cameraSelector);
    throw e;
  }
}

module.exports = {
  startStreamingIfNotStarted,
};
