const logger = require('../../../utils/logger');
const { INSTALLATION_PHASE, INSTALLATION_PHASE_STATE } = require('./constants');
const { formatDuration } = require('../utils/formatDuration');
const { addPullEvent, getPullProgress } = require('../utils/getPullProgress');

const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');
const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');

// Phase of an installation that follows the download of each image
const PULL_PHASE_BY_IMAGE = {
  [z2mContainerDescriptor.Image]: INSTALLATION_PHASE.PULL_Z2M,
  [mqttContainerDescriptor.Image]: INSTALLATION_PHASE.PULL_MQTT,
};

/**
 * @description Download an image missing from the machine, its progress followed by the installation and the prefetch.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {string} image - Image of a container descriptor.
 * @returns {Promise} Resolve once the image is on the machine.
 * @example
 * await downloadImage(this, 'eclipse-mosquitto:2.0.15');
 */
async function downloadImage(manager, image) {
  // Checked first, as Docker is asked for the registry even for an image it has: no need to be online then
  if (await manager.gladys.system.imageExists(image)) {
    logger.info(`${image} image already present`);
    return;
  }
  logger.info(`Pulling ${image} image...`);
  const phase = PULL_PHASE_BY_IMAGE[image];
  manager.updateInstallationPhase(phase, { state: INSTALLATION_PHASE_STATE.RUNNING });
  const startedAt = Date.now();
  let layers = {};
  await manager.gladys.system.pull(image, (event) => {
    layers = addPullEvent(layers, event);
    const progress = getPullProgress(layers);
    // Both are read at each event: an installation or a prefetch started meanwhile follows the download from then on
    manager.updateInstallationPhase(phase, { state: INSTALLATION_PHASE_STATE.RUNNING, progress });
    manager.updatePrefetchProgress(image, progress);
    manager.emitInstallProgress();
  });
  logger.info(`${image} image pulled in ${formatDuration(Date.now() - startedAt)}`);
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
