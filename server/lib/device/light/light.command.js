const Promise = require('bluebird');

const { getDeviceFeature } = require('../../../utils/device');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Command a light.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * light.command(message, classification, context);
 */
async function command(message, classification, context) {
  let nbAffectedLights = 0;
  try {
    const devices = await this.getLightsInRoom(context.room);
    switch (classification.intent) {
      case 'light.turn-on':
        // foreach devices in room
        await Promise.map(devices, async (device) => {
          // Get the binary feature
          const deviceFeature = getDeviceFeature(
            device,
            DEVICE_FEATURE_CATEGORIES.LIGHT,
            DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          );
          // and if the binary feature exists, call it
          if (deviceFeature) {
            await this.turnOn(device, deviceFeature);
            nbAffectedLights += 1;
          }
        });
        if (nbAffectedLights > 0) {
          this.messageManager.replyByIntent(message, 'light.turn-on.success', context);
        }
        break;
      case 'light.turn-off':
        // foreach devices in room
        await Promise.map(devices, async (device) => {
          // Get the binary feature
          const deviceFeature = getDeviceFeature(
            device,
            DEVICE_FEATURE_CATEGORIES.LIGHT,
            DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          );
          // and if the binary feature exists, call it
          if (deviceFeature) {
            await this.turnOff(device, deviceFeature);
            nbAffectedLights += 1;
          }
        });
        if (nbAffectedLights > 0) {
          this.messageManager.replyByIntent(message, 'light.turn-off.success', context);
        }
        break;
      default:
        throw new Error('Not found');
    }
    if (nbAffectedLights === 0) {
      this.messageManager.replyByIntent(message, 'light.not-found', context);
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(message, 'light.turn-on.fail', context);
  }
}

module.exports = {
  command,
};
