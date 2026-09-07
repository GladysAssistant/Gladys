const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');
const { getAudioBufferFromRequest, getAudioContentTypeFromRequest } = require('../utils/getAudioBufferFromRequest');

module.exports = function GatewayController(gladys) {
  /**
   * @api {get} /api/v1/gateway/status Get the Gladys Plus connection status
   * @apiName getStatus
   * @apiGroup Gateway
   */
  async function getStatus(req, res) {
    const status = await gladys.gateway.getStatus();
    res.json(status);
  }
  /**
   * @api {post} /api/v1/gateway/subscription/refresh Refresh the Gladys Plus subscription status
   * @apiName refreshSubscriptionStatus
   * @apiGroup Gateway
   * @apiDescription Ask Gladys Plus again whether the subscription is paid, and
   * unlock the Gladys Plus features of this instance when it is.
   */
  async function refreshSubscriptionStatus(req, res) {
    const status = await gladys.gateway.refreshSubscriptionStatus();
    res.json(status);
  }
  /**
   * @api {post} /api/v1/gateway/login Log in to Gladys Plus
   * @apiName Login
   * @apiGroup Gateway
   */
  async function login(req, res) {
    const loginResult = await gladys.gateway.login(req.body.email, req.body.password);
    res.json(loginResult);
  }

  /**
   * @api {post} /api/v1/gateway/logout Log out from Gladys Plus
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
   * @api {post} /api/v1/gateway/login-two-factor Finish the Gladys Plus login with a two-factor code
   * @apiName LoginTwoFactor
   * @apiGroup Gateway
   */
  async function loginTwoFactor(req, res) {
    const { recovery_codes: recoveryCodes } = await gladys.gateway.loginTwoFactor(
      req.body.two_factor_token,
      req.body.two_factor_code,
      req.body.two_factor_recovery_code,
      req.body.generate_recovery_codes,
    );
    res.json({
      success: true,
      recovery_codes: recoveryCodes,
    });
  }

  /**
   * @api {post} /api/v1/gateway/configure-two-factor Start the two-factor configuration on Gladys Plus
   * @apiName ConfigureTwoFactor
   * @apiGroup Gateway
   */
  async function configureTwoFactor(req, res) {
    const result = await gladys.gateway.configureTwoFactor(req.body.access_token);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/gateway/enable-two-factor Enable two-factor authentication on Gladys Plus
   * @apiName EnableTwoFactor
   * @apiGroup Gateway
   */
  async function enableTwoFactor(req, res) {
    const result = await gladys.gateway.enableTwoFactor(req.body.access_token, req.body.two_factor_code);
    res.json(result);
  }

  /**
   * @api {get} /api/v1/gateway/key Get the encryption keys of the Gladys Plus users
   * @apiName getUsersKeys
   * @apiGroup Gateway
   */
  async function getUsersKeys(req, res) {
    const keys = await gladys.gateway.getUsersKeys();
    res.json(keys);
  }

  /**
   * @api {patch} /api/v1/gateway/key Save the encryption keys of the Gladys Plus users
   * @apiName saveUsersKeys
   * @apiGroup Gateway
   */
  async function saveUsersKeys(req, res) {
    await gladys.gateway.saveUsersKeys(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/gateway/backup-key Save the backup encryption key
   * @apiName saveBackupKey
   * @apiGroup Gateway
   * @apiParam {String} backup_key The backup encryption key.
   */
  async function saveBackupKey(req, res) {
    await gladys.gateway.saveBackupKey(req.body.backup_key);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/gateway/backup List the Gladys Plus backups
   * @apiName getBackups
   * @apiGroup Gateway
   */
  async function getBackups(req, res) {
    const backups = await gladys.gateway.getBackups();
    res.json(backups);
  }

  /**
   * @api {post} /api/v1/gateway/backup Start a new backup
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
   * @api {post} /api/v1/gateway/backup/restore Restore a backup
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
   * @api {get} /api/v1/gateway/backup/restore/status Get the status of the running restore
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
   * @api {get} /api/v1/gateway/instance/key Get the fingerprint of the instance keys
   * @apiName getInstanceKeysFingerprint
   * @apiGroup Gateway
   */
  async function getInstanceKeysFingerprint(req, res) {
    const keys = await gladys.gateway.getInstanceKeysFingerprint();
    res.json(keys);
  }

  /**
   * @api {post} /api/v1/gateway/aichat/chat Ask the Gladys Plus AI chat
   * @apiName aiChat
   * @apiGroup Gateway
   */
  async function aiChat(req, res) {
    const response = await gladys.gateway.aiChat(req.body);
    res.json(response);
  }

  /**
   * @api {get} /api/v1/gateway/aichat/debug-context Get the context sent to the AI chat
   * @apiName getAiChatDebugContext
   * @apiGroup Gateway
   */
  async function getAiChatDebugContext(req, res) {
    const context = await gladys.gateway.getAiChatDebugContext(req.user.id);
    res.json(context);
  }

  /**
   * @api {get} /api/v1/gateway/aichat/quota Get the AI chat quota of the account
   * @apiName getOpenAIQuota
   * @apiGroup Gateway
   */
  async function getOpenAIQuota(req, res) {
    const quota = await gladys.gateway.getOpenAIQuota();
    res.json(quota);
  }

  /**
   * @api {get} /api/v1/gateway/aichat/models List the AI chat models available
   * @apiName getAiChatModels
   * @apiGroup Gateway
   */
  async function getAiChatModels(req, res) {
    const models = await gladys.gateway.getAiChatModels();
    res.json(models);
  }

  /**
   * @api {post} /api/v1/gateway/stt Transcribe an audio recording to text
   * @apiName stt
   * @apiGroup Gateway
   * @apiDescription Send an audio recording and get back its transcription. The
   * speech-to-text runs on Gladys Plus, so an active subscription is required.
   *
   * The body is the raw audio bytes, not a multipart form and not base64. Set the
   * `Content-Type` header to the format you send: any `audio/*` type or
   * `application/octet-stream` is accepted, and the body is limited to 5 MB. The
   * Gladys front-end sends mono 16-bit PCM WAV at 16 kHz, which is the safest
   * format to send.
   * @apiHeader {String} Authorization Access token (`Bearer <token>`) or API key.
   * @apiParam {Binary} body Raw audio (application/octet-stream or audio/*).
   * @apiSuccess {String} text Transcription of the recording.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "text": "turn on the light in the living room"
   * }
   * @apiError (Error 400) BadRequest The request body contains no audio.
   * @apiError (Error 402) PaymentRequired The Gladys Plus subscription is not active.
   * @apiError (Error 403) Forbidden The Gladys Plus plan does not allow this call.
   * @apiError (Error 429) TooManyRequests The speech-to-text quota is exhausted.
   */
  async function stt(req, res) {
    const audioBuffer = getAudioBufferFromRequest(req);
    const contentType = getAudioContentTypeFromRequest(req);
    const response = await gladys.gateway.stt(audioBuffer, contentType);
    res.json(response);
  }

  /**
   * @api {post} /api/v1/gateway/voice Talk to Gladys with your voice
   * @apiName processVoice
   * @apiGroup Gateway
   * @apiDescription Run a full voice command in one call: the recording is
   * transcribed, the transcription is answered by the AI assistant (which can read
   * the state of the house and control it), and the answer is turned into speech.
   *
   * This is the endpoint the voice assistant of the dashboard calls, and the one to
   * call to plug an external wake word engine into Gladys: record after the wake
   * word, POST the audio here, then play `ttsUrl` (or read `answer` with your own
   * text-to-speech).
   *
   * The body is the raw audio bytes, not a multipart form and not base64. Set the
   * `Content-Type` header to the format you send: any `audio/*` type or
   * `application/octet-stream` is accepted, and the body is limited to 5 MB. The
   * Gladys front-end sends mono 16-bit PCM WAV at 16 kHz, which is the safest
   * format to send.
   *
   * Speech-to-text, the AI answer and text-to-speech all run on Gladys Plus, so an
   * active subscription is required.
   * @apiHeader {String} Authorization Access token (`Bearer <token>`) or API key.
   * @apiParam {Binary} body Raw audio (application/octet-stream or audio/*).
   * @apiSuccess {String} transcription What Gladys understood.
   * @apiSuccess {String} answer Answer of the assistant, in the language of the user.
   * @apiSuccess {String} ttsUrl Temporary URL of the answer read out loud, `null` when there is no answer.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "transcription": "turn on the light in the living room",
   *   "answer": "Done, I turned on the light in the living room.",
   *   "ttsUrl": "https://.../tts.mp3"
   * }
   * @apiError (Error 400) BadRequest The request body contains no audio.
   * @apiError (Error 402) PaymentRequired The Gladys Plus subscription is not active.
   * @apiError (Error 403) Forbidden The Gladys Plus plan does not allow this call.
   * @apiError (Error 429) TooManyRequests The voice assistant quota is exhausted.
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
   * @api {post} /api/v1/gateway/tts Get an audio URL reading a text out loud
   * @apiName getTtsUrl
   * @apiGroup Gateway
   * @apiDescription Turn a text into speech and get a temporary URL to play the
   * result. The text-to-speech runs on Gladys Plus, so an active subscription is
   * required.
   * @apiHeader {String} Authorization Access token (`Bearer <token>`) or API key.
   * @apiParam {String} text Text to synthesize.
   * @apiParamExample {json} Request-Example
   * {
   *   "text": "The living room is 21 degrees."
   * }
   * @apiSuccess {String} url Temporary URL of the generated audio file.
   * @apiError (Error 402) PaymentRequired The Gladys Plus subscription is not active.
   * @apiError (Error 403) Forbidden The Gladys Plus plan does not allow this call.
   * @apiError (Error 429) TooManyRequests The text-to-speech quota is exhausted.
   */
  async function getTtsUrl(req, res) {
    const response = await gladys.gateway.getTTSApiUrl(req.body);
    res.json(response);
  }

  /**
   * @api {post} /api/v1/gateway/refresh-latest-gladys-version Refresh the latest Gladys version available
   * @apiName refreshLatestGladysVersion
   * @apiGroup Gateway
   */
  async function refreshLatestGladysVersion(req, res) {
    await gladys.gateway.getLatestGladysVersion();
    res.json({ message: 'Refresh finished' });
  }

  /**
   * @api {post} /api/v1/gateway/weekly-digest/send Send the weekly digest now
   * @apiName sendWeeklyDigest
   * @apiGroup Gateway
   */
  async function sendWeeklyDigest(req, res) {
    const result = await gladys.gateway.sendWeeklyDigest({ force: true });
    res.json(result);
  }

  /**
   * @api {post} /api/v1/gateway/weekly-digest/reschedule Reschedule the weekly digest
   * @apiName rescheduleWeeklyDigest
   * @apiGroup Gateway
   */
  async function rescheduleWeeklyDigest(req, res) {
    await gladys.gateway.scheduleWeeklyDigest();
    res.json({ success: true });
  }

  return Object.freeze({
    getStatus: asyncMiddleware(getStatus),
    refreshSubscriptionStatus: asyncMiddleware(refreshSubscriptionStatus),
    login: asyncMiddleware(login),
    logout: asyncMiddleware(logout),
    loginTwoFactor: asyncMiddleware(loginTwoFactor),
    configureTwoFactor: asyncMiddleware(configureTwoFactor),
    enableTwoFactor: asyncMiddleware(enableTwoFactor),
    getUsersKeys: asyncMiddleware(getUsersKeys),
    saveUsersKeys: asyncMiddleware(saveUsersKeys),
    saveBackupKey: asyncMiddleware(saveBackupKey),
    getBackups: asyncMiddleware(getBackups),
    createBackup: asyncMiddleware(createBackup),
    restoreBackup: asyncMiddleware(restoreBackup),
    getInstanceKeysFingerprint: asyncMiddleware(getInstanceKeysFingerprint),
    getRestoreStatus: asyncMiddleware(getRestoreStatus),
    aiChat: asyncMiddleware(aiChat),
    getAiChatDebugContext: asyncMiddleware(getAiChatDebugContext),
    getOpenAIQuota: asyncMiddleware(getOpenAIQuota),
    getAiChatModels: asyncMiddleware(getAiChatModels),
    stt: asyncMiddleware(stt),
    processVoice: asyncMiddleware(processVoice),
    getTtsUrl: asyncMiddleware(getTtsUrl),
    refreshLatestGladysVersion: asyncMiddleware(refreshLatestGladysVersion),
    sendWeeklyDigest: asyncMiddleware(sendWeeklyDigest),
    rescheduleWeeklyDigest: asyncMiddleware(rescheduleWeeklyDigest),
  });
};
