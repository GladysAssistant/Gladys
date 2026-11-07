const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');
const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');

/**
 * @description Download in parallel the images of the containers that are missing from the machine: before init
 * replaces a container by a new version, which keeps running meanwhile, or ahead of the installation (see
 * startPrefetch).
 * @returns {Promise} Resolve once the missing images are downloaded.
 * @example
 * await this.pullMissingImages();
 */
async function pullMissingImages() {
  const images = [z2mContainerDescriptor.Image, mqttContainerDescriptor.Image];
  // Each image is downloaded only when missing
  await Promise.all(images.map((image) => this.pullImage(image)));
}

module.exports = {
  pullMissingImages,
};
