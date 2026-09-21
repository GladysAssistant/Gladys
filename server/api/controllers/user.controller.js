const asyncMiddleware = require('../middlewares/asyncMiddleware');
const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

const { FORGOT_PASSWORD_METHODS } = require('../../lib/user/user.forgotPassword');

const LOGIN_SESSION_VALIDITY_IN_SECONDS = 365 * 24 * 60 * 60;

const FORGOT_PASSWORD_REPLIES = {
  [FORGOT_PASSWORD_METHODS.LINK]: 'user.forgot-password.success',
  [FORGOT_PASSWORD_METHODS.CODE]: 'user.forgot-password.code',
};

module.exports = function UserController(gladys) {
  /**
   * @description Get the sentence introducing the reset link or code, in the
   * language of the user, falling back to English for a language the brain
   * has no answers in.
   * @param {string} language - Language of the user.
   * @param {string} method - "link" or "code".
   * @returns {string} The sentence.
   * @example
   * getForgotPasswordReply('fr', 'code');
   */
  function getForgotPasswordReply(language, method) {
    const intent = FORGOT_PASSWORD_REPLIES[method];
    try {
      return gladys.brain.getReply(language, intent, {});
    } catch (e) {
      return gladys.brain.getReply('en', intent, {});
    }
  }

  /**
   * @api {post} /api/v1/user Create
   * @apiName CreateUser
   * @apiGroup User
   * @apiParam {String} firstname Firstname of the user
   * @apiParam {String} lastname Lastname of the user
   * @apiParam {String} email Email of the user
   * @apiParam {String} password Password of the user
   * @apiParam {string="admin","habitant", "guest"} role role of the user
   * @apiParam {date} birthdate Birthdate of the user
   * @apiParam {string="en", "fr", "de", "es"} language Language of the user
   * @apiSuccess {String} id id of the created user
   */
  async function create(req, res, next) {
    const user = await gladys.user.create(req.body);
    const scope = req.body.scope || ['dashboard:write', 'dashboard:read'];
    const session = await gladys.session.create(
      user.id,
      scope,
      LOGIN_SESSION_VALIDITY_IN_SECONDS,
      req.headers['user-agent'],
      req.headers.origin,
    );
    const response = { ...user, ...session };
    res.status(201).json(response);
  }

  /**
   * @api {post} /api/v1/login Login
   * @apiName LoginUser
   * @apiGroup User
   * @apiParam {String} email Email of the user
   * @apiParam {String} password Password of the user
   * @apiSuccess {String} refresh_token the refresh token
   * @apiSuccess {String} access_token the access token
   */
  async function login(req, res, next) {
    const user = await gladys.user.login(req.body.email, req.body.password);
    const scope = req.body.scope || ['dashboard:write', 'dashboard:read'];
    const session = await gladys.session.create(
      user.id,
      scope,
      LOGIN_SESSION_VALIDITY_IN_SECONDS,
      req.headers['user-agent'],
      req.headers.origin,
    );
    const response = { ...user, ...session };
    res.json(response);
  }

  /**
   * @api {get} /api/v1/user getUsers
   * @apiName getUsers
   * @apiGroup User
   */
  async function getUsers(req, res, next) {
    const options = req.query;
    if (options.fields) {
      options.fields = options.fields.split(',');
    }
    if (options.expand) {
      options.expand = options.expand.split(',');
    }
    const users = await gladys.user.get(options);
    res.json(users);
  }

  /**
   * @api {get} /api/v1/user/:user_selector getUserBySelector
   * @apiName getUserBySelector
   * @apiGroup User
   */
  async function getUserBySelector(req, res) {
    const user = await gladys.user.getBySelector(req.params.user_selector);
    res.json(user);
  }

  /**
   * @api {patch} /api/v1/user/:user_selector updateUser
   * @apiName updateUser
   * @apiGroup User
   */
  async function update(req, res) {
    const user = await gladys.user.updateBySelector(req.params.user_selector, req.body);
    res.json(user);
  }

  /**
   * @api {delete} /api/v1/user/:user_selector deleteUser
   * @apiName deleteUser
   * @apiGroup User
   */
  async function deleteUser(req, res) {
    if (req.user.selector === req.params.user_selector) {
      throw new BadParameters('You cannot delete yourself');
    }
    await gladys.user.destroy(req.params.user_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/me getMySelf
   * @apiName getMySelf
   * @apiGroup User
   */
  async function getMySelf(req, res, next) {
    const user = await gladys.user.getById(req.user.id);
    res.json(user);
  }

  /**
   * @api {get} /api/v1/me/picture getMyPicture
   * @apiName getMyPicture
   * @apiGroup User
   */
  async function getMyPicture(req, res, next) {
    const picture = await gladys.user.getPicture(req.user.id);
    res.send(picture);
  }

  /**
   * @api {patch} /api/v1/me updateMySelf
   * @apiName updateMySelf
   * @apiGroup User
   */
  async function updateMySelf(req, res, next) {
    delete req.body.role;
    const newUser = await gladys.user.update(req.user.id, req.body);
    res.json(newUser);
  }

  /**
   * @api {post} /api/v1/access_token getAccessToken
   * @apiName getAccessToken
   * @apiGroup User
   */
  async function getAccessToken(req, res) {
    const scope = req.body.scope || ['dashboard:write', 'dashboard:read'];
    const session = await gladys.session.getAccessToken(req.body.refresh_token, scope, req.headers.origin);
    res.json(session);
  }

  /**
   * @api {post} /api/v1/forgot_password forgotPassword
   * @apiName forgotPassword
   * @apiGroup User
   * @apiParam {string} email Email of the user
   * @apiParam {string} origin Origin the front is served from (window.location.origin)
   * @apiSuccess {string="link","code"} method "link" when a reset link was sent (the
   * origin was already used by an authenticated session of this instance),
   * "code" when a one-time code was sent instead, to type on the reset form.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "success": true,
   *   "method": "link"
   * }
   */
  async function forgotPassword(req, res) {
    const { method, link, code, user } = await gladys.user.forgotPassword(
      req.body.email,
      req.headers['user-agent'],
      req.body.origin,
    );
    const secret = method === FORGOT_PASSWORD_METHODS.LINK ? link : code;
    const text = getForgotPasswordReply(user.language, method);
    // Try to send the link or the code to the user if he has configured an external service like Telegram
    try {
      await gladys.message.sendToUser(user.selector, text);
      await gladys.message.sendToUser(user.selector, secret);
    } catch (e) {
      logger.error(`Error while sending forgot password message to user ${req.body.email}:`, e);
    }
    // Always log the secret so an admin can still recover it if messaging fails.
    logger.info(`Forgot password initiated for user ${req.body.email}, ${method} = ${secret}`);
    res.json({
      success: true,
      method,
    });
  }

  /**
   * @api {post} /api/v1/forgot_password/code verifyForgotPasswordCode
   * @apiName verifyForgotPasswordCode
   * @apiGroup User
   * @apiParam {string} email Email of the user
   * @apiParam {string} code The one-time code received after forgotPassword
   * @apiSuccess {string} access_token Short-lived token allowed to reset the password
   */
  async function verifyForgotPasswordCode(req, res) {
    const session = await gladys.user.verifyForgotPasswordCode(
      req.body.email,
      req.body.code,
      req.headers['user-agent'],
    );
    res.json(session);
  }

  /**
   * @api {post} /api/v1/reset_password resetPassword
   * @apiName resetPassword
   * @apiGroup User
   */
  async function resetPassword(req, res) {
    const user = await gladys.user.updatePassword(req.user.id, req.body.password);
    await gladys.session.revoke(req.user.id, req.session_id);
    res.json(user);
  }

  /**
   * @api {get} /api/v1/setup getSetupState
   * @apiName getSetupState
   * @apiGroup Setup
   */
  async function getSetupState(req, res) {
    const userCount = gladys.user.getUserCount();
    const accountConfigured = userCount > 0;
    res.json({
      account_configured: accountConfigured,
    });
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    login: asyncMiddleware(login),
    getMySelf: asyncMiddleware(getMySelf),
    getUsers: asyncMiddleware(getUsers),
    getUserBySelector: asyncMiddleware(getUserBySelector),
    update: asyncMiddleware(update),
    deleteUser: asyncMiddleware(deleteUser),
    getMyPicture: asyncMiddleware(getMyPicture),
    updateMySelf: asyncMiddleware(updateMySelf),
    getAccessToken: asyncMiddleware(getAccessToken),
    forgotPassword: asyncMiddleware(forgotPassword),
    verifyForgotPasswordCode: asyncMiddleware(verifyForgotPasswordCode),
    resetPassword: asyncMiddleware(resetPassword),
    getSetupState: asyncMiddleware(getSetupState),
  });
};
