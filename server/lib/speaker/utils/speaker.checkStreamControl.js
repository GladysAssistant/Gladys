const { EVENTS } = require('../../../utils/constants');

/**
 * @description Check if some action is needed on current stream.
 * @param {string} eventType - Type of sound event.
 * @param {string} speakerOutputName - Speaker output name.
 * @returns {object} Instance of stream control or undefined if stream must be stoped.
 * @example
 * message.buildStreamConfig(sound);
 */
function checkStreamControl(eventType, speakerOutputName) {
  // Get current stream confi or build new one
  let streamControl = this.mapOfStreamControl.get(speakerOutputName);

  if (streamControl && streamControl.soundRequest.eventType !== EVENTS.MUSIC.PAUSE) {
    const removeStreamOnSpecificEvent = [EVENTS.MUSIC.RANDOM, EVENTS.MUSIC.PREVIOUS, EVENTS.MUSIC.NEXT].includes(
      eventType,
    );

    const removeStreamControlIfCurrentStreamNotFinished =
      streamControl && streamControl.reader && !streamControl.reader.finished;
    if (removeStreamOnSpecificEvent || removeStreamControlIfCurrentStreamNotFinished) {
      // Stop current read if needed
      this.removeStreamControl(speakerOutputName);
      streamControl = undefined;
    }
  }
  return streamControl;
}

module.exports = {
  checkStreamControl,
};
