const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function PiholeController(piholeHandler) {
  /**
   * @api {get} /api/v1/pihole/getPiholeSummary
   * @apiName getPiholeSummary
   * @apiGroup PiHole
   * @apiSuccessExample {json} Success-Example
   */
  async function getPiholeSummary(req, res) {
    const result = await piholeHandler.getPiholeSummary(req.user.id);
    res.json(result);
  }

  return {
    'get /api/v1/pihole/getPiholeSummary': {
      authenticated: true,
      controller: asyncMiddleware(getPiholeSummary),
    },
  };
};
