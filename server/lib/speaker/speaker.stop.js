const logger = require('../../utils/logger');

/**
 * @description Stop sound in specific speaker output.
 * @param {object} sound - The sound request to stop send by the user.
 * @example
 * message.stop(sound);
 */
async function stop(sound) {
  const { provider, speakerOutputName } = sound;

  const streamControl = this.mapOfStreamControl.get(speakerOutputName);
  if (streamControl) {
    logger.debug(`Stop sound for speaker ${speakerOutputName} (provider: ${provider})`);
    this.removeStreamControl(speakerOutputName, this.mapOfStreamControl);
  }
}

module.exports = {
  stop,
};
