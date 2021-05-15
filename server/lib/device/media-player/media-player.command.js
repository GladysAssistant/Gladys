const { INTENTS } = require('../../../utils/constants');

const { getDeviceFeature } = require('../../../utils/device');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Command a media player, like a TV.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * mediaPlayer.command(message, classification, context);
 */
async function command(message, classification, context) {
  try {
    const device = await this.getDevice(context.id);
    switch (classification.intent) {
      case INTENTS.MEDIA_PLAYER.TURN_ON: {
        // Get the binary feature
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
          DEVICE_FEATURE_TYPES.MEDIA_PLAYER.BINARY,
        );
        // and if the binary feature exists, call it
        if (deviceFeature) {
          await this.turnOn(device, deviceFeature);
          this.messageManager.replyByIntent(message, `${INTENTS.MEDIA_PLAYER.TURN_ON}.success`, context);
        }
        break;
      }
      case INTENTS.MEDIA_PLAYER.TURN_OFF: {
        // Get the binary feature
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
          DEVICE_FEATURE_TYPES.MEDIA_PLAYER.BINARY,
        );
        // and if the binary feature exists, call it
        if (deviceFeature) {
          await this.turnOn(device, deviceFeature);
          this.messageManager.replyByIntent(message, `${INTENTS.MEDIA_PLAYER.TURN_OFF}.success`, context);
        }
        break;
      }
      default:
        throw new Error(`Media intent ${classification.intent} was not handled`);
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(
      message,
      `${classification.intent || INTENTS.MEDIA_PLAYER.TURN_ON}.error`,
      context,
    );
  }
}

module.exports = {
  command,
};
