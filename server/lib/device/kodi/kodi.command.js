const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Get the average temperature in a room.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * command(message, classification, context);
 */
async function command(message, classification, context) {

  // const roomEntity = classification.entities.find((entity) => entity.entity === 'room');
  let devices = null;
  if(context.room){
    devices = await this.getKodiInRoom(context.room);
  } else {
    devices = await this.getKodiDefault();
  }
  logger.debug('device: ', devices);
  if (!devices) {
    throw new NotFoundError('Device not found');
  }
  logger.debug(classification.intent);
  try {
    switch (classification.intent) {

      case 'kodi.ping':
        // foreach devices found
        await Promise.map(devices, async (device) => {
          await this.ping(device);
        });
        this.messageManager.replyByIntent(message, 'kodi.ping.success', context);
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    if (e instanceof NotFoundError && e.message === 'Room not found') {
      this.messageManager.replyByIntent(message, 'kodi.ping.get-in-room.fail.room-not-found', context);
    } else {
      this.messageManager.replyByIntent(message, 'kodi.ping.fail', context);
    }
  }
  return null;
}

module.exports = {
  command,
};
