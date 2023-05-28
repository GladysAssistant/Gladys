const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

const TIME_AFTER_KILL = 600000;

/**
 * @description Destroy stream after long period in pause.
 * @param {object} mapOfStreamControl - The map of stream control.
 * @param {object} speakerHandler - Current instance of SpeakerHandler.
 * @param {object} sound - The sound to pause send by the user.
 * @param {number} timeAfterKill - Time to consider a long period in pause.
 * @example killStreamAfterLongPause(mapOfStreamControl, speakerHandler, sound, 600000);
 */
function killStreamAfterLongPause(mapOfStreamControl, speakerHandler, sound, timeAfterKill) {
  const streamControl = mapOfStreamControl.get(sound.speakerOutputName);
  if (streamControl && streamControl.soundRequest.eventType === EVENTS.MUSIC.PAUSE) {
    if (
      streamControl.soundRequest.pauseTimestamp > 0 &&
      Date.now() - streamControl.soundRequest.pauseTimestamp >= timeAfterKill
    ) {
      speakerHandler.stop(sound);
    }
  }
}

/**
 * @description Pause sound in specific speaker output.
 * @param {object} sound - The sound request to pause send by the user.
 * @example
 * message.pause(sound);
 */
async function pause(sound) {
  const { provider, speakerOutputName } = sound;
  try {
    const streamControl = this.mapOfStreamControl.get(speakerOutputName);
    if (streamControl) {
      logger.debug(`Pause speaker ${speakerOutputName} (provider: ${provider})`);
      const speakerStream = streamControl.writer;
      if (speakerStream) {
        speakerStream.cork();
        streamControl.soundRequest.eventType = EVENTS.MUSIC.PAUSE;
        streamControl.soundRequest.pauseTimestamp = Date.now();
      }
      setTimeout(killStreamAfterLongPause, TIME_AFTER_KILL, this.mapOfStreamControl, this, sound, TIME_AFTER_KILL);
    }
  } catch (e) {
    logger.warn(e);
    this.removeStreamControl(speakerOutputName);
  }
}

module.exports = {
  pause,
};
