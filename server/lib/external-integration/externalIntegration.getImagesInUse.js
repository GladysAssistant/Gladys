const db = require('../../models');
const { SERVICE_TYPES } = require('../../utils/constants');

/**
 * @description Build the set of Docker image references still needed by the
 * external integrations installed on this machine: the image of each
 * integration plus the images its manifest declares for its sub-containers.
 * This is the guard every image removal goes through — two integrations may
 * legitimately share a third-party image (a Mosquitto broker, say), and
 * uninstalling one of them must not pull the image out from under the other.
 * @returns {Promise<Set<string>>} Resolve with the image references in use.
 * @example
 * const inUse = await gladys.externalIntegration.getImagesInUse();
 */
async function getImagesInUse() {
  const services = await db.Service.findAll({
    where: { type: SERVICE_TYPES.EXTERNAL },
    attributes: ['docker_image', 'manifest'],
  });
  const inUse = new Set();
  services.forEach((service) => {
    if (service.docker_image) {
      inUse.add(service.docker_image);
    }
    this.getManifestContainers(service).forEach((entry) => {
      if (entry.docker_image) {
        inUse.add(entry.docker_image);
      }
    });
  });
  return inUse;
}

module.exports = {
  getImagesInUse,
};
