const semver = require('semver');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { parseImageReference } = require('../../utils/dockerImage');

// Watchtower updates a container by re-pulling the exact reference it was
// created with. A reference pointing at a single immutable build (`v4.83.0`,
// or a digest) therefore always resolves to the same image: the update runs,
// finds nothing, and exits successfully without doing anything. Only moving
// tags (`v4`, `latest`) follow new releases.
const IMMUTABLE_TAG_REGEX = /^v?\d+\.\d+\.\d+/;

/**
 * @description Describe the Docker image the running Gladys container was created from,
 * and tell whether that reference can ever receive an update.
 * @returns {Promise} Resolve with the image description.
 * @example
 * const { image, pinned } = await gladys.system.getGladysImage();
 */
async function getGladysImage() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  // the reference a container was created from cannot change while it runs
  if (this.gladysImage) {
    return this.gladysImage;
  }

  const containerId = await this.getGladysContainerId();
  const containerDescription = await this.inspectContainer(containerId);
  const image = containerDescription.Config.Image;
  const { repository, tag, digest } = parseImageReference(image);
  const pinned = Boolean(digest) || IMMUTABLE_TAG_REGEX.test(tag);
  // the moving tag of the same major version, the one Watchtower is able to follow
  const version = semver.coerce(tag) || semver.coerce(this.gladysVersion);

  this.gladysImage = {
    // Watchtower only accepts container names as filters, not ids
    container_name: (containerDescription.Name || '').replace(/^\//, ''),
    image,
    tag,
    pinned,
    recommended_image: repository && version ? `${repository}:v${version.major}` : null,
  };

  return this.gladysImage;
}

module.exports = {
  getGladysImage,
  parseImageReference,
};
