const get = require('get-value');
const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Read the labels of a Docker image.
 * @param {string} imageName - Name of the image (with tag or digest).
 * @returns {Promise<object>} Resolve with the labels of the image.
 * @example
 * const labels = await getImageLabels('ghcr.io/john/my-integration:1.0.0');
 */
async function getImageLabels(imageName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const image = this.dockerode.getImage(imageName);
  const imageInspect = await image.inspect();
  return get(imageInspect, 'Config.Labels') || {};
}

module.exports = {
  getImageLabels,
};
