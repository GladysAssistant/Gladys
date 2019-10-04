const logger = require('../../../../utils/logger');

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
  // TODO how to handle commands ?
  logger.trace(`SmartThings connector: "commandHandler" not implemented : waiting for Gladys actions`);
}

module.exports = {
  commandHandler,
};
