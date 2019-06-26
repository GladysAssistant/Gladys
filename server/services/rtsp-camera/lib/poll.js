/**
 * @description Poll a camera
 * @param {Object} device - The camera to poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  const cameraImage = await this.getImage(device);
  await this.gladys.device.camera.setImage(device.selector, cameraImage);
}

module.exports = {
  poll,
};
