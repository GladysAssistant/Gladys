const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function HttpController(gladys) {
  /**
   * @api {post} /api/v1/http/request
   * @apiName httpRequest
   * @apiGroup Http
   * @apiParam {String} method Method of the request
   * @apiParam {String} url Url of the request
   * @apiParam {String} [body] Body of the request
   * @apiParam {Array} [headers] Headers of the request
   * @apiSuccessExample {json} Success-Example
   * {
   *   "data": {}
   *   "status": 200,
   *   "headers": ["content-type": "application/json"]
   * }
   */
  async function request(req, res) {
    const response = await gladys.http.request(req.body.method, req.body.url, req.body.body, req.body.headers);
    res.json(response);
  }

  return Object.freeze({
    request: asyncMiddleware(request),
  });
};
