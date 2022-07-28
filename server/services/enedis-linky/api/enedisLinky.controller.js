const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EnedisLinkyController(enedisLinkyHandler) {
  /**
   * @api {post} /api/v1/service/enedis-linky/linky/test Test authentication/connection
   * @apiName TestConnection
   * @apiGroup EnedisLinky
   */
  async function testConnection(req, res) {
    const threeDayAgo = enedisLinkyHandler.dayjs().subtract(3, 'day').format('YYYY-MM-DD');
    const twoDayAgo = enedisLinkyHandler.dayjs().subtract(2, 'day').format('YYYY-MM-DD');
    const oneDayAgo = enedisLinkyHandler.dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const today = enedisLinkyHandler.dayjs().format('YYYY-MM-DD');
    const tomorrow = enedisLinkyHandler.dayjs().add(1, 'day').format('YYYY-MM-DD');
    console.log('threeDayAgo', threeDayAgo)
    const linkyJson = await enedisLinkyHandler.getDailyConsumption(req.body, oneDayAgo, today);
    console.log('linkyJson', linkyJson)
    const linkyHourJson = await enedisLinkyHandler.getLoadCurve(req.body, oneDayAgo, today);
    console.log('linkyHourJson', linkyHourJson)
    res.send(linkyJson);
  }

  return {
    'post /api/v1/service/enedis-linky/linky/test': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(testConnection),
    },
  };
};
