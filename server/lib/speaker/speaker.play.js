const Volume = require('pcm-volume');

const logger = require('../../utils/logger');

/**
 * @description Play sound in specific speaker output.
 * @param {object} sound -  sound request to play send by the user.
 * @example
 * message.play({
    eventType: EVENTS.MUSIC.PLAY,
    provider: 'radio',
    providerType: 'URL',
    playlist: [],
    path: 'https://example.sream.com',
  });
 */
async function play(sound) {
  logger.debug('Sound event request: ', sound);

  const { eventType, provider, providerType } = sound;

  let speakerStream;
  let readStream;

  // Set speaker output name
  let { speakerOutputName } = sound;
  if (!speakerOutputName) {
    speakerOutputName = this.defaultOutputName;
    sound.speakerOutputName = speakerOutputName;
  }

  // Get current stream config or build new one
  let streamControl = this.checkStreamControl(eventType, speakerOutputName);

  if (!streamControl) {
    streamControl = this.buildStreamControl(sound);
    this.mapOfStreamControl.set(speakerOutputName, streamControl);
  }
  logger.debug('Current streamControl: ', streamControl);

  // Set sound volume level
  const { volumeLevel } = streamControl;

  // Get service source of sound event
  const soudService = await this.service.getService(provider);

  try {
    if (soudService) {
      const { soundHandler } = soudService;
      if (soundHandler) {
        if (streamControl) {
          speakerStream = streamControl.writer;
        }

        // eslint-disable-next-line no-underscore-dangle
        const needNewSpeakerStream = !speakerStream || speakerStream._writableState.finished;
        if (needNewSpeakerStream) {
          // Create stream output if not exist
          logger.debug(`Create new speaker stream for ${speakerOutputName}`);
          speakerStream = this.buildSpeakerStream(sound, soundHandler, speakerOutputName);
          streamControl.writer = speakerStream;
        } else if (speakerStream.writableCorked > 0) {
          // Uncork speaker (exit pause state)
          logger.debug(`Unpause speaker stream for ${speakerOutputName}`);
          speakerStream.uncork();
          return;
        }

        if (speakerStream) {
          // Get read stream of sound file
          if (sound.playlist && sound.path) {
            readStream = await soundHandler.getReadStream(sound.path);
          }

          if (readStream) {
            logger.debug(`Play sound ${sound.path} (speaker ${speakerOutputName} for provider ${providerType})`);
            const volumeControl = new Volume();
            volumeControl.setVolume(volumeLevel);
            readStream.pipe(volumeControl).pipe(speakerStream);

            streamControl.reader = readStream;
            streamControl.volume = volumeControl;
            streamControl.volumeLevel = volumeLevel;
          }
        }
      }
    }
  } catch (e) {
    logger.error(e);
    this.removeStreamControl(speakerOutputName);
  }
}

module.exports = {
  play,
};
