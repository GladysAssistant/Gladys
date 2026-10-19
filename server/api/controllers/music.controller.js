const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function MusicController(gladys) {
  /**
   * @api {get} /api/v1/device/:device_selector/music/capabilities getCapabilities
   * @apiName getCapabilities
   * @apiGroup Music
   * @apiDescription The on-demand operations the player's integration declared, read from
   * the stored manifest (no command, no connection required). 404 MUSIC_NOT_SUPPORTED on a
   * device that does not belong to an external integration.
   * @apiSuccessExample {json} Success-Example
   * { "browse": true, "search": true, "queue": true, "append": false }
   */
  async function getCapabilities(req, res) {
    res.json(gladys.device.music.getCapabilities(req.params.device_selector));
  }

  /**
   * @api {get} /api/v1/device/:device_selector/music/browse browse
   * @apiName browse
   * @apiGroup Music
   * @apiParam {string} [parent_id] The id of a browsable item; absent for the root.
   * @apiParam {number} [offset=0] The page offset.
   * @apiParam {number} [limit=50] The page size (max 100).
   * @apiSuccessExample {json} Success-Example
   * { "items": [{ "id": "favorites", "type": "folder", "title": "Favorites", "browsable": true }], "total": 3 }
   */
  async function browse(req, res) {
    res.json(await gladys.device.music.browse(req.params.device_selector, req.query));
  }

  /**
   * @api {get} /api/v1/device/:device_selector/music/search search
   * @apiName search
   * @apiGroup Music
   * @apiParam {string} q The query (1–200 characters).
   * @apiParam {string} [type] A media type to filter on (track, album, artist, playlist, radio, folder).
   * @apiParam {number} [limit=20] The page size (max 50).
   * @apiSuccessExample {json} Success-Example
   * { "items": [{ "id": "spotify:track:1", "type": "track", "title": "Blue in Green", "playable": true }] }
   */
  async function search(req, res) {
    res.json(await gladys.device.music.search(req.params.device_selector, req.query));
  }

  /**
   * @api {post} /api/v1/device/:device_selector/music/play play
   * @apiName play
   * @apiGroup Music
   * @apiParam {object} media The media reference `{ id, type }`.
   * @apiParam {string} [mode=replace] `replace`, `next` or `append` (the last two need `music.append`).
   * @apiSuccessExample {json} Success-Example
   * { "success": true }
   */
  async function play(req, res) {
    await gladys.device.music.play(req.params.device_selector, req.body.media, req.body.mode);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/device/:device_selector/music/queue getQueue
   * @apiName getQueue
   * @apiGroup Music
   * @apiParam {number} [offset=0] The page offset.
   * @apiParam {number} [limit=50] The page size (max 100).
   * @apiDescription `current_index` and `total` describe the full queue, `items` the requested page.
   * @apiSuccessExample {json} Success-Example
   * { "items": [], "current_index": 3, "total": 42 }
   */
  async function getQueue(req, res) {
    res.json(await gladys.device.music.getQueue(req.params.device_selector, req.query));
  }

  /**
   * @api {post} /api/v1/device/:device_selector/music/queue/play playQueueItem
   * @apiName playQueueItem
   * @apiGroup Music
   * @apiParam {number} index The index of the item in the full queue.
   * @apiSuccessExample {json} Success-Example
   * { "success": true }
   */
  async function playQueueItem(req, res) {
    await gladys.device.music.playQueueItem(req.params.device_selector, req.body.index);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/device/:device_selector/music/artwork/:key getArtwork
   * @apiName getArtwork
   * @apiGroup Music
   * @apiDescription An artwork served by the player's integration behind a key (the current
   * artwork state, or a key seen in a catalog or queue answer of the last hour), validated and
   * cached by the core. 404 on any other key, nothing sent to the integration.
   * @apiSuccessExample {json} Success-Example
   * { "image": "image/jpeg;base64,/9j/4AAQ..." }
   */
  async function getArtwork(req, res) {
    const image = await gladys.device.music.getArtwork(req.params.device_selector, req.params.key);
    res.json({ image });
  }

  return Object.freeze({
    getCapabilities: asyncMiddleware(getCapabilities),
    browse: asyncMiddleware(browse),
    search: asyncMiddleware(search),
    play: asyncMiddleware(play),
    getQueue: asyncMiddleware(getQueue),
    playQueueItem: asyncMiddleware(playQueueItem),
    getArtwork: asyncMiddleware(getArtwork),
  });
};
