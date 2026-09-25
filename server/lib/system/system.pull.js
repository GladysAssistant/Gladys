const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Pull an new container image.
 * @param {string} repoTag - Container image name (optionally with tag).
 * @param {Function} [onProgress] - Callback on progress event.
 * @param {object} [options] - Options.
 * @param {AbortSignal} [options.abortSignal] - Aborting it stops the download.
 * @returns {Promise} Pull result.
 * @example
 * await pull('my-image');
 */
async function pull(repoTag, onProgress = logger.trace, { abortSignal } = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  // stamped before the download, not after: a pull is slow on a Raspberry Pi
  // and the image must be protected from the cleanup for its whole duration
  this.imagePullTimes.set(repoTag, Date.now());
  // an undefined abortSignal would end up in the query string of the request
  const stream = await this.dockerode.pull(repoTag, abortSignal ? { abortSignal } : {});
  return new Promise((resolve, reject) => {
    this.dockerode.modem.followProgress(
      stream,
      (finishErr, output) => {
        if (finishErr) {
          return reject(finishErr);
        }
        // Docker answers 200 as soon as the download starts: a failure during
        // it (full disk, lost connection...) only shows up as an `error` event
        // in the progress stream, which followProgress does not reject on.
        const failure = Array.isArray(output) && output.find((progressEvent) => progressEvent && progressEvent.error);
        if (failure) {
          return reject(new Error((failure.errorDetail && failure.errorDetail.message) || failure.error));
        }
        return resolve(output);
      },
      onProgress,
    );
  });
}

module.exports = {
  pull,
};
