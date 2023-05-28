const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Destroy stream (reder and writer) and remove stream control from map.
 * @param {object} speakerOutputName - The speaker output name to remove.
 * @example
 * message.buildStreamConfig(sound);
 */
function removeStreamControl(speakerOutputName) {
  logger.debug(`Stop speaker stream for ${speakerOutputName}`);

  const streamControl = this.mapOfStreamControl.get(speakerOutputName);

  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MUSIC.FINISH,
    payload: {},
  });

  if (streamControl) {
    const { reader, writer } = streamControl;

    if (reader) {
      reader.end();
    }
    if (writer) {
      writer.destroy();
    }

    this.mapOfStreamControl.delete(speakerOutputName);
  }
}

module.exports = {
  removeStreamControl,
};
