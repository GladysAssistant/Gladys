/**
 * @description Save latest Gladys Version.
 * @param {string} latestGladysVersion - The latest Gladys version.
 * @example
 * saveLatestGladysVersion('v4.0.0');
 */
async function saveLatestGladysVersion(latestGladysVersion) {
  this.latestGladysVersion = latestGladysVersion;
}

module.exports = {
  saveLatestGladysVersion,
};
