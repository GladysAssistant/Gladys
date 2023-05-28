const logger = require('../../utils/logger');

/**
 * @description Mute sound in specific speaker output.
 * @param {object} sound - The sound request to mute send by the user.
 * @example
 * message.mute(sound);
 */
async function mute(sound) {
  const { provider, speakerOutputName } = sound;
  try {
    const streamControl = this.mapOfStreamControl.get(speakerOutputName);
    if (streamControl) {
      const volumeControl = streamControl.volume;
      if (volumeControl) {
        if (streamControl.volumeLevel > 0) {
          logger.debug(`Mute speaker ${speakerOutputName} for provider ${provider}`);
          streamControl.previousVolumeLevel = streamControl.volumeLevel;
          streamControl.volumeLevel = 0;
          volumeControl.setVolume(0);
        } else {
          logger.debug(`Unmute speaker ${speakerOutputName} for provider ${provider}`);
          streamControl.volumeLevel = streamControl.previousVolumeLevel;
          volumeControl.setVolume(streamControl.previousVolumeLevel);
        }
      }
    }
  } catch (e) {
    logger.warn(e);
    this.removeStreamControl(speakerOutputName);
  }
}

module.exports = {
  mute,
};
