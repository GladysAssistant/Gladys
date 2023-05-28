const logger = require('../../utils/logger');

/**
 * @description Change volume of sound in specific speaker output.
 * @param {object} sound - The sound request to change volume send by the user.
 * @example
 * message.volume(sound);
 */
async function volume(sound) {
  const { provider, speakerOutputName, volumeLevel } = sound;
  try {
    const streamControl = this.mapOfStreamControl.get(speakerOutputName);
    if (streamControl) {
      const volumeControl = streamControl.volume;
      if (volumeControl) {
        logger.debug(`Volumne change (${volumeLevel}) for speaker ${speakerOutputName} (provider: ${provider})`);
        volumeControl.setVolume(volumeLevel);
        streamControl.volumeLevel = volumeLevel;
      }
    }
  } catch (e) {
    logger.warn(e);
    this.removeStreamControl(speakerOutputName);
  }
}

module.exports = {
  volume,
};
