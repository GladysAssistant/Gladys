const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Remove a Docker image. Removing a reference that is only one of
 * several tags of the same image untags it; the image itself goes when its last
 * tag does — that is Docker's own semantics and exactly what we want here.
 * @param {string} imageName - Name of the image (with tag or digest), or its id.
 * @param {object} [options] - Options for removal (see https://docs.docker.com/engine/api/v1.37/#operation/ImageDelete).
 * `force` is pinned to false and cannot be overridden: the "never force" rule is
 * the safety invariant of every caller, it belongs here rather than in call-site discipline.
 * @returns {Promise<boolean>} Resolve with true if Docker removed something, false if it declined.
 * @example
 * const removed = await removeImage('ghcr.io/john/my-integration:1.0.0');
 */
async function removeImage(imageName, options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const image = this.dockerode.getImage(imageName);
  try {
    await image.remove({ ...options, force: false });
    return true;
  } catch (e) {
    // 404: the image is already gone, the caller got what it asked for.
    // 409: a container we don't know about still references it — Docker is the
    // authority on that, and declining is the outcome we want. Never force:
    // deleting an image from under a running container is how you turn a
    // cleanup into an outage.
    if (e.statusCode === 404 || e.statusCode === 409) {
      return false;
    }
    throw e;
  }
}

module.exports = {
  removeImage,
};
