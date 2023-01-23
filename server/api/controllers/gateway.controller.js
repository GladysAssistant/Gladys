const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');

module.exports = function GatewayController(gladys) {
  /**
   * @api {get} /api/v1/gateway/status
   * @apiName getStatus
   * @apiGroup Gateway
   */
  async function getStatus(req, res) {
    const status = await gladys.gateway.getStatus();
    res.json(status);
  }
  /**
   * @api {post} /api/v1/gateway/login
   * @apiName Login
   * @apiGroup Gateway
   */
  async function login(req, res) {
    const loginResult = await gladys.gateway.login(req.body.email, req.body.password);
    res.json(loginResult);
  }

  /**
   * @api {post} /api/v1/gateway/logout
   * @apiName Logout
   * @apiGroup Gateway
   */
  async function logout(req, res) {
    await gladys.gateway.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/gateway/login-two-factor
   * @apiName LoginTwoFactor
   * @apiGroup Gateway
   */
  async function loginTwoFactor(req, res) {
    await gladys.gateway.loginTwoFactor(req.body.two_factor_token, req.body.two_factor_code);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/gateway/key
   * @apiName getUsersKeys
   * @apiGroup Gateway
   */
  async function getUsersKeys(req, res) {
    const keys = await gladys.gateway.getUsersKeys();
    res.json(keys);
  }

  /**
   * @api {patch} /api/v1/gateway/key
   * @apiName getUsersKeys
   * @apiGroup Gateway
   */
  async function saveUsersKeys(req, res) {
    await gladys.gateway.saveUsersKeys(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/gateway/backup
   * @apiName getBackups
   * @apiGroup Gateway
   */
  async function getBackups(req, res) {
    const backups = await gladys.gateway.getBackups();
    res.json(backups);
  }

  /**
   * @api {post} /api/v1/gateway/backup
   * @apiName createBackup
   * @apiGroup Gateway
   */
  async function createBackup(req, res) {
    gladys.event.emit(EVENTS.GATEWAY.CREATE_BACKUP);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/gateway/backup/restore
   * @apiName restoreBackup
   * @apiGroup Gateway
   */
  async function restoreBackup(req, res) {
    gladys.event.emit(EVENTS.GATEWAY.RESTORE_BACKUP, {
      file_url: req.body.file_url,
    });
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/gateway/backup/restore/status
   * @apiName getRestoreStatus
   * @apiGroup Gateway
   */
  async function getRestoreStatus(req, res) {
    res.json({
      restore_in_progress: gladys.gateway.restoreInProgress,
      restore_errored: gladys.gateway.restoreErrored,
    });
  }

  /**
   * @api {get} /api/v1/gateway/instance/key
   * @apiName getInstanceKeysFingerprint
   * @apiGroup Gateway
   */
  async function getInstanceKeysFingerprint(req, res) {
    const keys = await gladys.gateway.getInstanceKeysFingerprint();
    res.json(keys);
  }

  /**
   * @api {post} /api/v1/gateway/openai/ask
   * @apiName askOpenAI
   * @apiGroup Gateway
   */
  async function openAIAsk(req, res) {
    const response = await gladys.gateway.openAIAsk(req.body);
    res.json(response);
  }

  return Object.freeze({
    getStatus: asyncMiddleware(getStatus),
    login: asyncMiddleware(login),
    logout: asyncMiddleware(logout),
    loginTwoFactor: asyncMiddleware(loginTwoFactor),
    getUsersKeys: asyncMiddleware(getUsersKeys),
    saveUsersKeys: asyncMiddleware(saveUsersKeys),
    getBackups: asyncMiddleware(getBackups),
    createBackup: asyncMiddleware(createBackup),
    restoreBackup: asyncMiddleware(restoreBackup),
    getInstanceKeysFingerprint: asyncMiddleware(getInstanceKeysFingerprint),
    getRestoreStatus: asyncMiddleware(getRestoreStatus),
    openAIAsk: asyncMiddleware(openAIAsk),
  });
};
