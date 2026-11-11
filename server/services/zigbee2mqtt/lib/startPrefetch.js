const logger = require('../../../utils/logger');
const {
  INSTALLATION_STATE,
  INSTALLATION_ERROR,
  IMAGES,
  IMAGE_SIZE_IN_BYTES,
  DISK_SPACE_MARGIN_IN_BYTES,
  getIdlePrefetch,
} = require('./constants');
const { getInstallationError } = require('./finishInstallation');

const { RUNNING, DONE, FAILED } = INSTALLATION_STATE;

/**
 * @description Tell the failure of the prefetch, shown by the setup page like the failure of an installation.
 * @param {object} prefetch - State of the prefetch.
 * @param {Error} error - Why it failed.
 * @example
 * failPrefetch(this.prefetch, new Error('docker fail pull'));
 */
function failPrefetch(prefetch, error) {
  logger.error('Zigbee2mqtt: failed to download the images ahead of the installation:', error);
  prefetch.state = FAILED;
  prefetch.error = getInstallationError(error);
}

/**
 * @description Download the missing images in the background, then tell the outcome of the prefetch.
 * @param {object} manager - Zigbee2mqtt manager.
 * @returns {Promise} Resolve once the outcome is told, never rejects: nobody waits for it.
 * @example
 * downloadImages(this);
 */
async function downloadImages(manager) {
  const { prefetch } = manager;
  try {
    await manager.pullMissingImages();
    prefetch.state = DONE;
    prefetch.progress = 100;
    logger.info('Zigbee2mqtt: images downloaded ahead of the installation');
  } catch (e) {
    failPrefetch(prefetch, e);
  }
  manager.emitInstallProgress();
}

/**
 * @description Download the images missing from the machine ahead of the installation, which then does not wait for
 * them: the setup page starts it as it opens, while the user prepares the coordinator. Nothing is downloaded when the
 * images do not fit in the free disk space, as a full disk would break Gladys itself. Started once: a running or done
 * prefetch is left as is, a failed one starts again.
 * @returns {Promise<object>} Resolve with the state of the prefetch once the disk space is checked, without waiting for
 * the downloads: the setup page follows them like an installation (see emitInstallProgress).
 * @example
 * const prefetch = await this.startPrefetch();
 */
async function startPrefetch() {
  if (this.prefetch.state === RUNNING || this.prefetch.state === DONE) {
    return this.prefetch;
  }
  // Running from now on, with no wait since the check: a call meanwhile starts nothing
  this.prefetch = { ...getIdlePrefetch(), state: RUNNING };
  this.prefetchProgressByImage = {};
  const { prefetch } = this;
  try {
    const [imagesPresent, diskSpace] = await Promise.all([
      Promise.all(IMAGES.map((image) => this.gladys.system.imageExists(image))),
      this.gladys.system.getDiskSpace(),
    ]);
    const missingImages = IMAGES.filter((image, index) => !imagesPresent[index]);
    // The missing images, and a margin left free for the rest of Gladys
    prefetch.neededBytes =
      missingImages.length === 0
        ? 0
        : missingImages.reduce((sum, image) => sum + IMAGE_SIZE_IN_BYTES[image], DISK_SPACE_MARGIN_IN_BYTES);
    // Unknown without df: the images are downloaded anyway
    prefetch.freeBytes = diskSpace ? diskSpace.available : null;
    if (missingImages.length === 0) {
      prefetch.state = DONE;
      prefetch.progress = 100;
    } else if (prefetch.freeBytes !== null && prefetch.freeBytes < prefetch.neededBytes) {
      logger.warn(
        `Zigbee2mqtt: ${prefetch.neededBytes} bytes needed to download the images, ${prefetch.freeBytes} bytes free`,
      );
      prefetch.state = FAILED;
      prefetch.error = { code: INSTALLATION_ERROR.NOT_ENOUGH_DISK_SPACE, message: null };
    } else {
      // The images whose download makes the progress of the prefetch (see updatePrefetchProgress)
      missingImages.forEach((image) => {
        this.prefetchProgressByImage[image] = 0;
      });
      downloadImages(this);
    }
  } catch (e) {
    failPrefetch(prefetch, e);
  }
  this.emitInstallProgress();
  return prefetch;
}

module.exports = {
  startPrefetch,
};
