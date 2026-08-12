const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Compute basePath in host and container from mounted point or give default ones.
 * @returns {Promise} Base path in host/container to store files.
 * @example
 * const { basePathOnContainer, basePathOnHost } = await getGladysBasePath();
 */
async function getGladysBasePath() {
  let basePathOnContainer = '/var/lib/gladysassistant';
  // Fetch container path mount
  if (process.env.SQLITE_FILE_PATH) {
    const base = process.env.SQLITE_FILE_PATH;
    basePathOnContainer = base.substring(0, base.lastIndexOf('/'));
  }
  // Find mount linked to this path to fetch host path
  let currentContainerId;
  try {
    currentContainerId = await this.getGladysContainerId();
  } catch (e) {
    // Gladys runs directly on the host (no container): the path it reads and
    // writes IS the host path, no container -> host translation is needed.
    if (e instanceof PlatformNotCompatible) {
      return { basePathOnContainer, basePathOnHost: basePathOnContainer };
    }
    throw e;
  }
  const gladysMounts = await this.getContainerMounts(currentContainerId);
  if (gladysMounts) {
    const baseMount = gladysMounts.find((mount) => {
      return mount.Destination === basePathOnContainer;
    });
    if (baseMount) {
      return { basePathOnContainer, basePathOnHost: baseMount.Source };
    }
  }
  return { basePathOnContainer, basePathOnHost: '/var/lib/gladysassistant' };
}

module.exports = {
  getGladysBasePath,
};
