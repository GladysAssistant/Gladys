/**
 * @description Compute basePath in host and container from mounted point or give default ones.
 * @returns {Promise} Base path in host/container to store files.
 * @example
 * basePath();
 */
async function basePath() {
  let basePathOnContainer = '/var/lib/gladysassistant';
  // Fetch container path mount
  if (process.env.SQLITE_FILE_PATH) {
    const base = process.env.SQLITE_FILE_PATH;
    basePathOnContainer = base.substring(0, base.lastIndexOf('/'));
  }
  // Find mount linked to this path to fetch host path
  const currentContainerId = await this.gladys.system.getGladysContainerId();
  const gladysMounts = await this.gladys.system.getContainerMounts(currentContainerId);
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
  basePath,
};
