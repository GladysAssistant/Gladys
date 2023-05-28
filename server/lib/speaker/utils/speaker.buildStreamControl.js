const logger = require('../../../utils/logger');

/**
 * @description Build new stream control (used to save state of stream).
 * @param {object} sound - The sound to play send by the user.
 * @returns {object} New stream control (used to save state of stream).
 * @example
 * message.buildStreamControl(sound);
 */
function buildStreamControl(sound) {
  let { volumeLevel } = sound;
  if (!volumeLevel) {
    volumeLevel = 0.8;
  }

  const streamControl = {
    volumeLevel,
    previousVolumeLevel: volumeLevel,
    soundRequest: sound,
  };
  logger.trace('New streamControl: ', streamControl);

  return streamControl;
}

module.exports = {
  buildStreamControl,
};
