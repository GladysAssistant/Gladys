const logger = require('../../../utils/logger');
const {
  INSTALLATION_PHASE_STATE,
  INSTALLATION_ERROR,
  PULL_PHASE_BY_IMAGE,
  IMAGE_SIZE_IN_BYTES,
  DISK_SPACE_MARGIN_IN_BYTES,
} = require('./constants');
const { formatDuration } = require('../utils/formatDuration');
const { addPullEvent, getPullProgress } = require('../utils/getPullProgress');

// Docker reports a download every few seconds while it goes on: without any progress for that long, the download is
// stuck (registry or connection that stopped answering) and would hold the installation forever
const PULL_STALL_TIMEOUT_IN_MS = 5 * 60 * 1000;

/**
 * @description Refuse to download an image that does not fit in the free disk space, with the margin left for the rest
 * of Gladys: its databases write on the same disk, a download that fills it would break them. Checked before each
 * download, not only by the prefetch: the installation and the update at start-up download as much.
 * @param {object} system - Gladys system module.
 * @param {string} image - Image of a container descriptor.
 * @returns {Promise} Resolve when the image fits, or when the free space is unknown (without df): downloaded anyway.
 * @example
 * await checkDiskSpace(this.gladys.system, 'eclipse-mosquitto:2.0.15');
 */
async function checkDiskSpace(system, image) {
  const diskSpace = await system.getDiskSpace();
  const neededBytes = IMAGE_SIZE_IN_BYTES[image] + DISK_SPACE_MARGIN_IN_BYTES;
  if (diskSpace && diskSpace.available < neededBytes) {
    const error = new Error(
      `Not enough disk space to download ${image}: ${neededBytes} bytes needed, ${diskSpace.available} bytes free`,
    );
    // Shown by the setup page like the failure of the prefetch (see finishInstallation)
    error.installationError = { code: INSTALLATION_ERROR.NOT_ENOUGH_DISK_SPACE, message: null };
    throw error;
  }
}

/**
 * @description Download an image, its progress followed by the installation and the prefetch.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {string} image - Image of a container descriptor.
 * @param {string} phase - Phase of an installation that follows the download.
 * @returns {Promise} Resolve once the image is downloaded, reject when the download fails or stalls.
 * @example
 * await pull(this, 'eclipse-mosquitto:2.0.15', 'pull_mqtt');
 */
async function pull(manager, image, phase) {
  logger.info(`Pulling ${image} image...`);
  manager.updateInstallationPhase(phase, { state: INSTALLATION_PHASE_STATE.RUNNING });
  const startedAt = Date.now();
  const abortController = new AbortController();
  // Rejects as soon as the download is given up, as the pull is not sure to settle once aborted: a stream closed
  // without an error would even resolve it, with an image half downloaded
  const stalled = new Promise((resolve, reject) => {
    abortController.signal.addEventListener('abort', () => {
      reject(new Error(`Download of ${image} stalled: no progress for ${PULL_STALL_TIMEOUT_IN_MS / 60000} min`));
    });
  });
  let stallTimer = null;
  // Armed when the download starts, then again each time it makes progress
  const watchForStall = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => abortController.abort(), PULL_STALL_TIMEOUT_IN_MS);
  };
  let layers = {};
  watchForStall();
  try {
    await Promise.race([
      manager.gladys.system.pull(
        image,
        (event) => {
          const nextLayers = addPullEvent(layers, event);
          // Not on an event that tells nothing new: Docker can repeat the position of a download that is stuck
          if (nextLayers !== layers) {
            watchForStall();
          }
          layers = nextLayers;
          const progress = getPullProgress(layers);
          // Both are read at each event: an installation or a prefetch started meanwhile follows the download from
          // then on
          manager.updateInstallationPhase(phase, { state: INSTALLATION_PHASE_STATE.RUNNING, progress });
          manager.updatePrefetchProgress(image, progress);
          manager.emitInstallProgress();
        },
        { abortSignal: abortController.signal },
      ),
      stalled,
    ]);
  } finally {
    clearTimeout(stallTimer);
  }
  logger.info(`${image} image pulled in ${formatDuration(Date.now() - startedAt)}`);
}

/**
 * @description Download an image missing from the machine, when it fits on the disk. Its phase in the installation
 * tells the outcome.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {string} image - Image of a container descriptor.
 * @returns {Promise} Resolve once the image is on the machine, reject when it does not fit, or when the download fails
 * or stalls.
 * @example
 * await downloadImage(this, 'eclipse-mosquitto:2.0.15');
 */
async function downloadImage(manager, image) {
  // Checked first, as Docker is asked for the registry even for an image it has: no need to be online then
  if (await manager.gladys.system.imageExists(image)) {
    logger.info(`${image} image already present`);
    return;
  }
  const phase = PULL_PHASE_BY_IMAGE[image];
  try {
    await checkDiskSpace(manager.gladys.system, image);
    await pull(manager, image, phase);
  } catch (e) {
    // This download failed, not another one running alongside it (see finishInstallation)
    manager.updateInstallationPhase(phase, { state: INSTALLATION_PHASE_STATE.FAILED });
    throw e;
  }
  // Here rather than by the caller: init downloads the images before installing the containers, which then find them
  manager.updateInstallationPhase(phase, { state: INSTALLATION_PHASE_STATE.DONE });
}

/**
 * @description Download the image of a container unless it is on the machine already. One download of an image at a
 * time: the installation and the prefetch wait for the same one.
 * @param {string} image - Image of a container descriptor.
 * @returns {Promise} Resolve once the image is on the machine.
 * @example
 * await this.pullImage('eclipse-mosquitto:2.0.15');
 */
async function pullImage(image) {
  // Failed in the last pullMissingImages, after which init goes on with the containers in place: a container to create
  // fails at once on the same error, instead of waiting for a stalled registry once more. Downloaded again by the next
  // pullMissingImages.
  if (this.imagePullFailures[image]) {
    this.updateInstallationPhase(PULL_PHASE_BY_IMAGE[image], { state: INSTALLATION_PHASE_STATE.FAILED });
    throw this.imagePullFailures[image];
  }
  if (this.imagePulls[image]) {
    await this.imagePulls[image];
    return;
  }
  this.imagePulls[image] = downloadImage(this, image);
  try {
    await this.imagePulls[image];
  } finally {
    // The next call checks again whether the image is there
    delete this.imagePulls[image];
  }
}

module.exports = {
  pullImage,
};
