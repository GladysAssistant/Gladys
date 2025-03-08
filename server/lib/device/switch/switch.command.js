const Promise = require('bluebird');

const { getDeviceFeature } = require('../../../utils/device');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, STATE } = require('../../../utils/constants');

/**
 * @description Command a switch.
 * @param {object} message - The message sent by the user.
 * @param {object} classification - The classification calculated by the brain.
 * @param {object} context - The context object containing found variables in question.
 * @returns {Promise} Resolve when the command was executed.
 * @example
 * light.command(message, classification, context);
 */
async function command(message, classification, context) {
  const deviceEntity = classification.entities.find((entity) => entity.entity === 'device');
  try {
    if (!deviceEntity) {
      throw new NotFoundError('Device not found');
    }
    const device = this.stateManager.get('device', deviceEntity.option);
    if (!device) {
      throw new NotFoundError('Device not found');
    }
    const deviceFeature = getDeviceFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.SWITCH,
      DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    );
    if (!deviceFeature) {
      throw new NotFoundError('Feature not found');
    }
    if (classification.intent === 'switch.turn-on') {
      await this.deviceManager.setValue(device, deviceFeature, STATE.ON);
      this.messageManager.replyByIntent(message, 'switch.turn-on.success', context);
    } else if (classification.intent === 'switch.turn-off') {
      await this.deviceManager.setValue(device, deviceFeature, STATE.OFF);
      this.messageManager.replyByIntent(message, 'switch.turn-off.success', context);
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(message, `${classification.intent}.fail`, context);
  }
  return null;
}

module.exports = {
  command,
};
