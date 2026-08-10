const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Pull an new container image.
 * @param {string} repoTag - Container image name (optionally with tag).
 * @param {Function} [onProgress] - Callback on progress event.
 * @returns {Promise} Pull result.
 * @example
 * await pull('my-image');
 */
async function pull(repoTag, onProgress = logger.trace) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  // stamped before the download, not after: a pull is slow on a Raspberry Pi
  // and the image must be protected from the cleanup for its whole duration
  this.imagePullTimes.set(repoTag, Date.now());
  const stream = await this.dockerode.pull(repoTag);
  return new Promise((resolve, reject) => {
    this.dockerode.modem.followProgress(
      stream,
      (finishErr, output) => {
        if (finishErr) {
          return reject(finishErr);
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
