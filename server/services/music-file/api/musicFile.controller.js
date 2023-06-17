const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { MUSICFILE } = require('../lib/utils/musicFile.constants');

module.exports = function MusicFileController(musicFileHandler) {
  /**
   * @api {get} /api/v1/service/music-file/playlists Returns list of playlists on music-file provider.
   * @apiName getPlaylists
   * @apiGroup Music
   */
  async function getPlaylists(req, res) {
    const result = musicFileHandler.getPlaylists();

    res.json({
      success: true,
      provider: MUSICFILE.SERVICE_NAME,
      playlists: result,
    });
  }

  /**
   * @api {get} /api/v1/service/music-file/capabilities Returns list of capabilities on music-file provider.
   * @apiName getCapabilities
   * @apiGroup Music
   */
  async function getCapabilities(req, res) {
    const result = musicFileHandler.getCapabilities();
    res.json(result);
  }

  /**
   * @api {get} /api/v1/service/music-file/play/:speaker_output_name/:playlist/:volume
   *  Play music with music-file provider and playlist requested.
   * @apiName play
   * @apiGroup Music
   */
  async function play(req, res) {
    const { playlist, volume } = req.params;
    const speakerOutputName = req.params.speaker_output_name;
    if (speakerOutputName && playlist) {
      musicFileHandler.play(speakerOutputName, playlist, volume);
    }

    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/music-file/previous/:speaker_output_name
   *  Play previous music with music-file provider requested.
   * @apiName previous
   * @apiGroup Music
   */
  async function previous(req, res) {
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName) {
      musicFileHandler.previous(speakerOutputName);
    }

    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/music-file/next/:speaker_output_name
   *  Play next music with music-file provider requested.
   * @apiName next
   * @apiGroup Music
   */
  async function next(req, res) {
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName) {
      musicFileHandler.next(speakerOutputName);
    }

    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/music-file/random/:speaker_output_name
   *  Play random music with music-file provider requested.
   * @apiName random
   * @apiGroup Music
   */
  async function random(req, res) {
    const speakerOutputName = req.params.speaker_output_name;

    if (speakerOutputName) {
      musicFileHandler.random(speakerOutputName);
    }

    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/music-file/playlists': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getPlaylists),
    },
    'get /api/v1/service/music-file/capabilities': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getCapabilities),
    },
    'get /api/v1/service/music-file/play/:speaker_output_name/:playlist/:volume': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(play),
    },
    'get /api/v1/service/music-file/previous/:speaker_output_name': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(previous),
    },
    'get /api/v1/service/music-file/next/:speaker_output_name': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(next),
    },
    'get /api/v1/service/music-file/random/:speaker_output_name': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(random),
    },
  };
};
