const { DeviceErrorTypes } = require('st-schema');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { CAPABILITY_BY_ID } = require('../utils/capabilities');

/**
 * @description Device command request. Control the devices and respond with new device states
 * @param {Object} response - CommandResponse response object.
 * @param {Array} requestedDevices - Of ST device commands.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/smartthings-schema-reference.html#Command
 * @see https://github.com/SmartThingsCommunity/st-schema-nodejs
 *
 * @example
 *  await smartthingsHandler.commandHandler(
 *    response,
 *    [
 *      {
 *        "externalDeviceId": "partner-device-id",
 *        "deviceCookie": {
 *          "lastcookie": "cookie value"
 *        },
 *        "commands":
 *        [
 *          {
 *            "component": "main",
 *            "capability": "st.switchLevel",
 *            "command": "setLevel",
 *            "arguments": [80]
 *          },
 *          {
 *            "component": "main",
 *            "capability": "st.switch",
 *            "command": "on",
 *            "arguments": []
 *          }
 *        ]
 *      },
 *    ]
 *  );
 */
function commandHandler(response, requestedDevices) {
  requestedDevices.forEach((device) => {
    const internalDevice = this.gladys.stateManager.get('deviceByExternalId', device.externalDeviceId);
    const deviceResponse = response.addDevice(device.externalDeviceId);
    if (internalDevice) {
      device.commands.forEach((item) => {
        try {
          const capability = CAPABILITY_BY_ID[item.capability.substring(3)] || {};
          const commandCapability = capability[item.command];
          const feature = internalDevice.features.find((f) => f.type === commandCapability.featureType);
          const value = commandCapability.readValue(item.arguments, feature);

          const event = {
            device_feature_external_id: feature.external_id,
            state: value,
          };
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
        } catch (e) {
          deviceResponse.setError('Impossible to handle command', DeviceErrorTypes.CAPABILITY_NOT_SUPPORTED);
        }
      });
    } else {
      deviceResponse.setError('Device not found in Gladys', DeviceErrorTypes.DEVICE_DELETED);
    }
  });
}

module.exports = {
  commandHandler,
};
