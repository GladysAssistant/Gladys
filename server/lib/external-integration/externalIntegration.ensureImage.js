const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Make a Docker image available on the machine: pull it, and when
 * the pull fails, accept an image already present locally. The registry stays
 * the source of truth whenever it answers (a mutable tag is refreshed on every
 * install/update); the local fallback is what lets a developer install and
 * iterate on an image built with `docker build` on the host, which exists in
 * no registry — the dev install mode used to be unusable without pushing the
 * image somewhere first.
 * @param {string} image - Container image reference (optionally with tag).
 * @returns {Promise} Resolves when the image is available on the machine.
 * @example
 * await gladys.externalIntegration.ensureImage('my-integration:dev');
 */
async function ensureImage(image) {
  try {
    await this.system.pull(image);
    return;
  } catch (e) {
    let existsLocally = false;
    try {
      existsLocally = await this.system.imageExists(image);
    } catch (inspectError) {
      logger.debug(`Unable to check the local presence of the image ${image}`, inspectError);
    }
    if (!existsLocally) {
      logger.warn(`Unable to pull image ${image}`, e);
      // an amd64-only image on a Raspberry Pi fails here: explicit message, not a raw Docker error
      throw new BadParameters(
        `UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`,
      );
    }
    logger.info(`Unable to pull image ${image}, using the image already present locally (local build)`);
  }
}

module.exports = {
  ensureImage,
};
