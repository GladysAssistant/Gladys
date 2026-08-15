/**
 * @description Called when a MQTT device is created in Gladys.
 * @param {object} device - The created device.
 * @example
 * postCreate(device);
 */
async function postCreate(device) {
  this.listenToHomeAssistantDeviceStateIfNeeded(device);
}

/**
 * @description Called when a MQTT device is updated in Gladys.
 * @param {object} device - The updated device.
 * @example
 * postUpdate(device);
 */
async function postUpdate(device) {
  this.listenToHomeAssistantDeviceStateIfNeeded(device);
}

/**
 * @description Called when a MQTT device is deleted in Gladys.
 * @param {object} device - The deleted device.
 * @example
 * postDelete(device);
 */
async function postDelete(device) {
  this.unListenToHomeAssistantDevice(device);
}

module.exports = {
  postCreate,
  postUpdate,
  postDelete,
};
