const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Pull an new container image.
 * @param {string} repoTag - Container image name (optionally with tag).
 * @param {Function} [onProgress] - Callback on progress event.
 * @example
 * await pull('my-image');
 */
async function pull(repoTag, onProgress = () => {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  return new Promise((resolve, reject) => {
    this.dockerode.pull(repoTag, (error, stream) => {
      if (error) {
        reject(error);
      }

      this.dockerode.modem.followProgress(
        stream,
        (finishErr, output) => {
          if (finishErr) {
            reject(finishErr);
          }
          resolve(output);
        },
        onProgress,
      );
    });
  });
}

module.exports = {
  pull,
};
