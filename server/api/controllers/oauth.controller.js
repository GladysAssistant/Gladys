const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function OAuthController(gladys) {
  /**
   * @api {get} /api/v1/oauth/client/:client_id
   * @apiName getClient
   * @apiGroup OAuth
   * @apiDescription Get OAuth client information.
   *
   * @apiSuccessExample {json} Success-Example
   * {
   *   name: 'Friendly name 1',
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
   * @api {get} /api/v1/oauth/client
   * @apiName get
   * @apiGroup OAuth
   * @apiDescription Get OAuth all clients.
   *
   * @apiSuccessExample {json} Success-Example
   * [
   *   {
   *     name: 'Friendly name 1',
   *     client_id: 'oauth_client_1',
   *     client_secret: 'this_is_secret_for_oauth_client_1',
   *     redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
   *     grants: ['grant_1', 'grant_2'],
   *   },
   *   {
   *     name: 'Friendly name 2',
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

  /**
   * @api {post} /api/v1/oauth/token
   * @apiName token
   * @apiGroup OAuth
   * @apiDescription Generates access/refresh token.
   */
  async function token(req, res) {
    return gladys.oauth.token(req, res);
  }

  /**
   * @api {get} /api/v1/oauth/authorize
   * @apiName authorize
   * @apiGroup OAuth
   * @apiDescription OAuth2 Authorize flow.
   */
  async function authorize(req, res) {
    return gladys.oauth.authorize(req, res);
  }

  return Object.freeze({
    getClient: asyncMiddleware(getClient),
    get: asyncMiddleware(get),
    token: asyncMiddleware(token),
    authorize: asyncMiddleware(authorize),
  });
};
