const Promise = require('bluebird');

/**
 * @description Start streaming
 * @param {Object} cameraSelector - The camera to stream.
 * @param {string} backendUrl - URL of the backend.
 * @param {boolean} isGladysGateway - If the streaming start from Gladys Gateway or local.
 * @param {number} segmentDuration - The duration of one segment in seconds.
 * @returns {Promise} Resolve when stream started.
 * @example
 * startStreaming(device);
 */
async function startStreamingIfNotStarted(cameraSelector, backendUrl, isGladysGateway, segmentDuration) {
  const liveStreamingStarted = this.liveStreamsStarting.get(cameraSelector);
  const liveStream = this.liveStreams.get(cameraSelector);
  // Converting a local stream to gateway stream if needed
  if (liveStream && liveStream.isGladysGateway === false && isGladysGateway === true) {
    await this.convertLocalStreamToGateway(cameraSelector, backendUrl);
  }
  if (liveStreamingStarted) {
    return liveStreamingStarted;
  }
  try {
    const liveStreamStartingPromise = this.startStreaming(cameraSelector, backendUrl, isGladysGateway, segmentDuration);
    this.liveStreamsStarting.set(cameraSelector, liveStreamStartingPromise);
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
