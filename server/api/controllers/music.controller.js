const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function MessageController(gladys) {
  /**
   * @api {post} /api/v1/music/:device_selector/play Play music
   * @apiName play
   * @apiGroup Music
   *
   * @apiParam {string} uri URI of the song to play
   * @apiSuccessExample {json} Success-Example
   *
   */
  async function play(req, res) {
    await gladys.music.play(req.params.device_selector, req.body.uri);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/music/:device_selector/playlist Get playlist
   * @apiName getPlaylist
   * @apiGroup Music
   *
   * @apiSuccessExample {json} Success-Example
   *
   */
  async function getPlaylist(req, res) {
    const playlists = await gladys.music.getPlaylist(req.params.device_selector);
    res.json(playlists);
  }

  return Object.freeze({
    play: asyncMiddleware(play),
    getPlaylist: asyncMiddleware(getPlaylist),
  });
};
