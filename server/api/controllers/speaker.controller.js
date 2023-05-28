const { EVENTS } = require('../../utils/constants');
const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function SpeakerController(gladys) {
  /**
   * @api {get} /api/v1/speaker/:speaker_output_name/status Get status of speaker.
   * @apiName status
   * @apiGroup Speaker
   */
  async function status(req, res) {
    const speakerOutputName = req.params.speaker_output_name;

    const streamControl = await gladys.speaker.mapOfStreamControl.get(speakerOutputName);

    if (streamControl) {
      res.json({
        volumeLevel: streamControl.volumeLevel,
        path: streamControl.path,
        play:
          streamControl.writer &&
          !streamControl.writer._writableState.finished && // eslint-disable-line
          streamControl.soundRequest.eventType === EVENTS.MUSIC.PLAY,
        random: streamControl.soundRequest.random,
        provider: streamControl.soundRequest.provider,
      });
    } else {
      res.json({});
    }
  }

  return Object.freeze({
    status: asyncMiddleware(status),
  });
};
