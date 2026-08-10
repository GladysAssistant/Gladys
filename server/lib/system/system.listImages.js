const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return the list of Docker images present on the machine.
 * @param {object} [options] - Listing options (see https://docs.docker.com/engine/api/v1.37/#operation/ImageList),
 * typically `{ filters: { label: ['io.gladysassistant.manifest'] } }` to only get the images Gladys pulled itself.
 * @returns {Promise<Array>} Resolve with the list of images.
 * @example
 * const images = await listImages({ filters: { label: ['io.gladysassistant.manifest'] } });
 */
async function listImages(options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const images = await this.dockerode.listImages(options);
  return images.map((image) => ({
    id: image.Id,
    // Docker reports an untagged image either with an empty/absent RepoTags or
    // with the `<none>:<none>` placeholder, depending on the daemon version
    tags: (image.RepoTags || []).filter((tag) => tag && tag !== '<none>:<none>'),
    labels: image.Labels || {},
    size: image.Size,
    created_at: image.Created,
  }));
}

module.exports = {
  listImages,
};
