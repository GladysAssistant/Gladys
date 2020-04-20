const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return list of images.
 * @param {Object} [options] - List of filtering options.
 * @returns {Promise} Resolve with list of images.
 * @example
 * const images = await getImages();
 */
async function getImages(options = { all: true }) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const images = await this.dockerode.listImages(options);
  return images.map((image) => {
    return {
      name: image.RepoTags[0],
      id: image.Id,
      created_at: image.Created,
    };
  });
}

module.exports = {
  getImages,
};
