const Promise = require('bluebird');

/**
 * @description Start streaming
 * @param {Object} cameraSelector - The camera to stream.
 * @param {string} backendUrl - URL of the backend.
 * @param {boolean} isGladysGateway - If the streaming start from Gladys Gateway or local.
 * @returns {Promise} Resolve when stream started.
 * @example
 * startStreaming(device);
 */
async function startStreamingIfNotStarted(cameraSelector, backendUrl, isGladysGateway) {
  const liveStreamingStarted = this.liveStreamsStarting.get(cameraSelector);
  if (liveStreamingStarted) {
    await liveStreamingStarted;
  }
  const liveStreamStartingPromise = this.startStreaming(cameraSelector, backendUrl, isGladysGateway);
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
