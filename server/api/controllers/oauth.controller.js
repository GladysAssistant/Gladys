const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function OAuthController(gladys) {
  /**
   * @api {post} /api/v1/oauth
   * @apiName createClient
   * @apiGroup OAuth
   * @apiDescription Add new OAuth client.
   *
   * @apiParam {String} client_id Client ID.
   *
   * @apiSuccessExample {json} Success-Example
   * {
   *
   * }
   */
  async function createClient(req, res) {
    const client = await gladys.oauth.createClient(req.body);
    res.json(client);
  }

  /**
   * @api {get} /api/v1/oauth/:client_id
   * @apiName getClient
   * @apiGroup OAuth
   * @apiDescription Get OAuth client information.
   *
   * @apiSuccessExample {json} Success-Example
   * {
   *
   * }
   */
  async function getClient(req, res) {
    const client = await gladys.oauth.getClient(req.params.client_id);
    res.json(client);
  }

  return Object.freeze({
    createClient: asyncMiddleware(createClient),
    getClient: asyncMiddleware(getClient),
  });
};
