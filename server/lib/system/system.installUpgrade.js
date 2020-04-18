const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Install new upgrade.
 * @example
 * await installUpgrade();
 */
async function installUpgrade() {
  // if the system is not running docker, exit
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const containers = await this.getContainers();
  const watchTowerContainer = containers.find((container) => {
    return container.image.startsWith('containrrr/watchtower');
  });
  if (!watchTowerContainer) {
    throw new PlatformNotCompatible('WATCHTOWER_NOT_FOUND');
  }
  await this.dockerode.getContainer(watchTowerContainer.id).restart();
  // reset download upgrade status
  this.downloadUpgradeError = null;
  this.downloadUpgradeFinished = null;
  this.downloadUpgradeLastEvent = null;
}

module.exports = {
  installUpgrade,
};
