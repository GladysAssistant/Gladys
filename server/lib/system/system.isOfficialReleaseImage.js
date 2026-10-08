/**
 * @description Return true only when this instance runs an official release image of
 * Gladys Assistant. Gates the latest version check sent to Gladys Plus, which also
 * sends usage statistics: a development server, a CI run, an AI agent, a pull request
 * or dev image must never send it.
 *
 * ⚠️ GLADYS_OFFICIAL_RELEASE_IMAGE is only set by docker/Dockerfile.buildx when it is
 * built by .github/workflows/docker-release-build.yml. Never set it anywhere else,
 * even to test like in production: stub this function in the tests instead.
 * @returns {boolean} True when running an official release image.
 * @example
 * gladys.system.isOfficialReleaseImage();
 */
function isOfficialReleaseImage() {
  return process.env.NODE_ENV === 'production' && process.env.GLADYS_OFFICIAL_RELEASE_IMAGE === 'true';
}

module.exports = {
  isOfficialReleaseImage,
};
