const Speaker = require('speaker');

const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Build new speaker stream (write stream).
 * @param {object} sound - The sound request to play.
 * @param {object} soundHandler - The soundHandler to use for play sound.
 * @returns {object} New speaker stream (write stream) with sound play requested.
 * @example
 * message.buildSpeakerStream(sound, soundHandler);
 */
function buildSpeakerStream(sound, soundHandler) {
  // Create the Speaker instance
  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 44100, // 44,100 Hz sample rate
    // device: 'hw:0,0' // use to select device output
  });

  const { playlist, speakerOutputName } = sound;

  speaker.on('finish', async () => {
    logger.trace(`Speaker finish ${speakerOutputName}`);
    if (playlist && soundHandler) {
      sound.type = EVENTS.MUSIC.PLAY;
      const soundFileDesc = await soundHandler.buildPlayQuery(sound, playlist, 1);
      if (soundFileDesc.path) {
        // Play next sound
        this.play(soundFileDesc);
      } else {
        // Stop playing
        this.removeStreamControl(speakerOutputName);
      }
    }
  });

  return speaker;
}

module.exports = {
  buildSpeakerStream,
};
