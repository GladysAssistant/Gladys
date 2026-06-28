const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');
const { getAudioBufferFromRequest, getAudioContentTypeFromRequest } = require('../utils/getAudioBufferFromRequest');

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
   * @api {post} /api/v1/gateway/aichat/chat
   * @apiName aiChat
   * @apiGroup Gateway
   */
  async function aiChat(req, res) {
    const response = await gladys.gateway.aiChat(req.body);
    res.json(response);
  }

  /**
   * @api {get} /api/v1/gateway/aichat/debug-context
   * @apiName getAiChatDebugContext
   * @apiGroup Gateway
   */
  async function getAiChatDebugContext(req, res) {
    const context = await gladys.gateway.getAiChatDebugContext(req.user.id);
    res.json(context);
  }

  /**
   * @api {get} /api/v1/gateway/aichat/quota
   * @apiName getOpenAIQuota
   * @apiGroup Gateway
   */
  async function getOpenAIQuota(req, res) {
    const quota = await gladys.gateway.getOpenAIQuota();
    res.json(quota);
  }

  /**
   * @api {post} /api/v1/gateway/stt
   * @apiName stt
   * @apiGroup Gateway
   * @apiParam {Binary} body Raw audio (application/octet-stream or audio/*).
   */
  async function stt(req, res) {
    const audioBuffer = getAudioBufferFromRequest(req);
    const contentType = getAudioContentTypeFromRequest(req);
    const response = await gladys.gateway.stt(audioBuffer, contentType);
    res.json(response);
  }

  /**
   * @api {post} /api/v1/gateway/voice
   * @apiName processVoice
   * @apiGroup Gateway
   * @apiParam {Binary} body Raw audio (application/octet-stream or audio/*).
   */
  async function processVoice(req, res) {
    const audioBuffer = getAudioBufferFromRequest(req);
    const contentType = getAudioContentTypeFromRequest(req);
    const response = await gladys.gateway.processVoiceMessage({
      audio: audioBuffer,
      contentType,
      user: req.user,
    });
    res.json(response);
  }

  /**
   * @api {post} /api/v1/gateway/tts
   * @apiName getTtsUrl
   * @apiGroup Gateway
   * @apiParam {string} text Text to synthesize.
   */
  async function getTtsUrl(req, res) {
    const response = await gladys.gateway.getTTSApiUrl(req.body);
    res.json(response);
  }

  /**
   * @api {post} /api/v1/gateway/refresh-latest-gladys-version
   * @apiName refreshLatestGladysVersion
   * @apiGroup Gateway
   */
  async function refreshLatestGladysVersion(req, res) {
    await gladys.gateway.getLatestGladysVersion();
    res.json({ message: 'Refresh finished' });
  }

  /**
   * @api {post} /api/v1/gateway/weekly-digest/send
   * @apiName sendWeeklyDigest
   * @apiGroup Gateway
   */
  async function sendWeeklyDigest(req, res) {
    const result = await gladys.gateway.sendWeeklyDigest({ force: true });
    res.json(result);
  }

  /**
   * @api {post} /api/v1/gateway/weekly-digest/reschedule
   * @apiName rescheduleWeeklyDigest
   * @apiGroup Gateway
   */
  async function rescheduleWeeklyDigest(req, res) {
    await gladys.gateway.scheduleWeeklyDigest();
    res.json({ success: true });
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
    aiChat: asyncMiddleware(aiChat),
    getAiChatDebugContext: asyncMiddleware(getAiChatDebugContext),
    getOpenAIQuota: asyncMiddleware(getOpenAIQuota),
    stt: asyncMiddleware(stt),
    processVoice: asyncMiddleware(processVoice),
    getTtsUrl: asyncMiddleware(getTtsUrl),
    refreshLatestGladysVersion: asyncMiddleware(refreshLatestGladysVersion),
    sendWeeklyDigest: asyncMiddleware(sendWeeklyDigest),
    rescheduleWeeklyDigest: asyncMiddleware(rescheduleWeeklyDigest),
  });
};
