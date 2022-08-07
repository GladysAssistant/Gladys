const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EnedisLinkyController(enedisLinkyHandler) {
  /**
   * @api {post} /api/v1/service/enedis-linky/linky/test Test authentication/connection
   * @apiName TestConnection
   * @apiGroup EnedisLinky
   */
  async function testConnection(req, res) {
    const threeDayAgo = enedisLinkyHandler
      .dayjs()
      .subtract(3, 'day')
      .format('YYYY-MM-DD');
    const twoDayAgo = enedisLinkyHandler
      .dayjs()
      .subtract(2, 'day')
      .format('YYYY-MM-DD');
    await enedisLinkyHandler.getDailyConsumption(req.body, threeDayAgo, twoDayAgo);

    res.send({
      success: true,
    });
  }

  return {
    'post /api/v1/service/enedis-linky/linky/test': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(testConnection),
    },
  };
};
