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
  const containers = await this.dockerode.listContainers({
    all: true,
  });
  const watchTowerContainer = containers.find((container) => {
    return container.Image === 'containrrr/watchtower';
  });
  if (!watchTowerContainer) {
    throw new PlatformNotCompatible('WATCHTOWER_NOT_FOUND');
  }
  await this.dockerode.getContainer(watchTowerContainer.Id).restart();
  // reset download upgrade status
  this.downloadUpgradeError = null;
  this.downloadUpgradeFinished = null;
  this.downloadUpgradeLastEvent = null;
}

module.exports = {
  installUpgrade,
};
