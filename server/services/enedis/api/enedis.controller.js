const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EnedisController(enedisHandler) {
  /**
   * @api {post} /api/v1/service/enedis/sync Sync
   * @apiName Config
   * @apiGroup Enedis
   */
  async function sync(req, res) {
    await enedisHandler.sync(true);
    res.json({
      success: true,
    });
  }

  return {
    'post /api/v1/service/enedis/sync': {
      authenticated: true,
      controller: asyncMiddleware(sync),
    },
  };
};
