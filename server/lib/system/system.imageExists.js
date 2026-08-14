const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Check if a Docker image is present on the machine.
 * @param {string} imageName - Name of the image (with tag or digest).
 * @returns {Promise<boolean>} Resolve with true if the image exists locally.
 * @example
 * const exists = await imageExists('my-integration:dev');
 */
async function imageExists(imageName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  try {
    await this.dockerode.getImage(imageName).inspect();
    return true;
  } catch (e) {
    if (e.statusCode === 404) {
      return false;
    }
    throw e;
  }
}

module.exports = {
  imageExists,
};
