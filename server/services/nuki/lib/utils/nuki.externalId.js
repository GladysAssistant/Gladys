const { DEVICE_EXTERNAL_ID_BASE } = require('./nuki.constants');

/**
 * @description Get the mqtt topic from a device.
 * @param {object} device - The Gladys device.
 * @returns {string} Return the built mqtt topic.
 * @example
 * getTopicFromExternalId(device);
 */
function getTopicFromExternalId(device) {
  return `${DEVICE_EXTERNAL_ID_BASE}/${device.external_id.split(':')[1]}/`;
}

module.exports = {
  getTopicFromExternalId,
};
