const logger = require('../../utils/logger');

/**
 * @description Make sure a Docker image is present on the machine before a
 * container is created from it at START time: an image already there is
 * used as is (no network needed, no refresh of a mutable tag — that is the
 * job of install/update), a missing one is pulled. The case is a backup
 * restored on another machine (migration to a new mini-PC through Gladys
 * Plus): the `t_service` rows came back with the database, but neither the
 * containers nor the images did — without this pull, the container creation
 * failed on the missing image and every external integration ended in
 * ERROR after the migration. A pull failure stays an explicit
 * `UNABLE_TO_PULL_IMAGE` error (ensureImage), so the start fails with a
 * message the UI can show rather than a raw Docker error.
 * @param {string} image - Container image reference (optionally with tag).
 * @returns {Promise} Resolves when the image is available on the machine.
 * @example
 * await gladys.externalIntegration.ensureImagePresent('ghcr.io/john/my-integration:1.0.0');
 */
async function ensureImagePresent(image) {
  const existsLocally = await this.system.imageExists(image);
  if (existsLocally) {
    return;
  }
  logger.info(`Image ${image} is not present on this machine (new machine or restored backup), pulling it`);
  await this.ensureImage(image);
}

module.exports = {
  ensureImagePresent,
};
