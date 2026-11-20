const Promise = require('bluebird');

const logger = require('../../utils/logger');

/**
 * @description List the images of an integration (main container + every
 * declared sub-container, `manual` entries included) that are NOT present
 * on the machine. Normally empty: install and update make every image
 * available before anything starts. The one case where it is not is a
 * backup restored on another machine (migration to a new mini-PC): the
 * `t_service` rows came back with the database, the images did not. The
 * presence check is best-effort: an image whose inspection fails is
 * counted as present, the container creation then fails with the real
 * Docker error instead of a misleading pull.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<Array<string>>} Resolve with the missing image references.
 * @example
 * const missing = await gladys.externalIntegration.getMissingImages(service);
 */
async function getMissingImages(service) {
  const images = [
    ...new Set([service.docker_image, ...this.getManifestContainers(service).map((e) => e.docker_image)]),
  ];
  const missing = [];
  await Promise.each(images, async (image) => {
    try {
      const exists = await this.system.imageExists(image);
      if (!exists) {
        missing.push(image);
      }
    } catch (e) {
      logger.debug(`Unable to check the local presence of the image ${image}`, e);
    }
  });
  return missing;
}

module.exports = {
  getMissingImages,
};
