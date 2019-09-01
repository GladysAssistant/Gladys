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
   *   client_id: 'oauth_client_1',
   *   client_secret: 'this_is_secret_for_oauth_client_1',
   *   redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
   *   grants: ['grant_1', 'grant_2'],
   * }
   */
  async function getClient(req, res) {
    const client = await gladys.oauth.getClient(req.params.client_id);
    if (!client) {
      res.status(404);
    }
    res.json(client);
  }

  /**
   * @api {get} /api/v1/oauth
   * @apiName get
   * @apiGroup OAuth
   * @apiDescription Get OAuth all clients.
   *
   * @apiSuccessExample {json} Success-Example
   * [
   *   {
   *     client_id: 'oauth_client_1',
   *     client_secret: 'this_is_secret_for_oauth_client_1',
   *     redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
   *     grants: ['grant_1', 'grant_2'],
   *   },
   *   {
   *     client_id: 'oauth_client_2',
   *     client_secret: 'this_is_secret_for_oauth_client_2',
   *     redirect_uris: ['http://oauth2.fr'],
   *   }
   * ]
   *
   * }
   */
  async function get(req, res) {
    const clients = await gladys.oauth.getAllClients();
    res.json(clients);
  }

  return Object.freeze({
    createClient: asyncMiddleware(createClient),
    getClient: asyncMiddleware(getClient),
    get: asyncMiddleware(get),
  });
};
