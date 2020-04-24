const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const { EVENTS } = require('../../../utils/constants');

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
  if (context.room) {
    devices = await this.getKodiInRoom(context.room);
  } else {
    devices = await this.getKodiDefault();
  }
  logger.trace('device: ', devices);
  if (!devices) {
    throw new NotFoundError('Device not found');
  }
  logger.trace(classification.intent);
  try {
    let eventToSend;
    let successMsg;

    switch (classification.intent) {
      case EVENTS.KODI.PING:
      case EVENTS.KODI.MUTE:
      case EVENTS.KODI.UNMUTE:
      case EVENTS.KODI.PLAYER.PLAY:
      case EVENTS.KODI.PLAYER.STOP:
      case EVENTS.KODI.VOLUME.SET:
      case EVENTS.KODI.VOLUME.INCREASE:
      case EVENTS.KODI.VOLUME.DECREASE:
      case EVENTS.KODI.MOVIES.OPEN:
        eventToSend = classification.intent;
        successMsg = `${classification.intent}.success`;

        // foreach devices found
        await Promise.map(devices, async (device) => {
          logger.debug(`Send event ${eventToSend} on device "${device.selector}"`);
          this.eventManager.emit(eventToSend, device.id);
        });
        this.messageManager.replyByIntent(message, successMsg, context);
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
