const DIGEST_PREFIX = 'sha256:';

/**
 * @description Split a Docker image reference into its repository, tag and digest.
 * @param {string} image - A Docker image reference.
 * @returns {object} The repository, the tag and the digest of the reference.
 * @example
 * parseImageReference('gladysassistant/gladys:v4');
 */
function parseImageReference(image) {
  // a container started from an image id has the raw digest as reference
  if (image.startsWith(DIGEST_PREFIX)) {
    return { repository: null, tag: null, digest: image.substring(DIGEST_PREFIX.length) };
  }
  const [reference, digest] = image.split('@');
  const lastColonIndex = reference.lastIndexOf(':');
  const lastSlashIndex = reference.lastIndexOf('/');
  // a colon placed before the last slash belongs to the registry port, not to a tag
  const hasTag = lastColonIndex > lastSlashIndex;
  return {
    repository: hasTag ? reference.substring(0, lastColonIndex) : reference,
    tag: hasTag ? reference.substring(lastColonIndex + 1) : 'latest',
    digest,
  };
}

module.exports = {
  parseImageReference,
};
