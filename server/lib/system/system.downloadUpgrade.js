const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const getConfig = require('../../utils/getConfig');
const logger = require('../../utils/logger');

const config = getConfig();

/**
 * @description Download new release of Gladys.
 * @param {string} tag - Tag to download.
 * @example
 * await downloadUpgrade('v4.0.0');
 */
async function downloadUpgrade(tag) {
  // reset download upgrade status
  this.downloadUpgradeError = null;
  this.downloadUpgradeFinished = null;
  this.downloadUpgradeLastEvent = null;
  // i the system is not running docker, exit
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const repoTag = `${config.dockerImage}:${tag}`;
  // pull upgrade
  const onProgress = (event) => {
    this.downloadUpgradeLastEvent = event;
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_PROGRESS,
      payload: {
        event,
      },
    });
  };

  try {
    await this.pull(repoTag, onProgress);
    this.downloadUpgradeError = null;
    this.downloadUpgradeFinished = true;

    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_FINISHED,
      payload: {},
    });

    this.installUpgrade();
  } catch (pullError) {
    this.downloadUpgradeError = pullError;
    logger.debug(pullError);
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_FAILED,
      payload: {},
    });
  }
}

module.exports = {
  downloadUpgrade,
};
