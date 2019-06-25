const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function SessionController(gladys) {
  /**
   * @api {post} /api/v1/session/:session_id/revoke revoke
   * @apiName revoke
   * @apiGroup Session
   *
   */
  async function revoke(req, res) {
    const session = await gladys.session.revoke(req.user.id, req.params.session_id);
    res.json(session);
  }

  /**
   * @api {post} /api/v1/session/api_key createApiKey
   * @apiName createApiKey
   * @apiGroup Session
   *
   */
  async function createApiKey(req, res) {
    const scope = req.body.scope || ['dashboard:write', 'dashboard:read'];
    const session = await gladys.session.createApiKey(req.user.id, scope);
    res.status(201).json(session);
  }

  /**
   * @api {get} /api/v1/session get
   * @apiName get
   * @apiGroup Session
   *
   */
  async function get(req, res) {
    const sessions = await gladys.session.get(req.user.id, req.query);
    res.json(sessions);
  }

  return Object.freeze({
    revoke: asyncMiddleware(revoke),
    createApiKey: asyncMiddleware(createApiKey),
    get: asyncMiddleware(get),
  });
};
