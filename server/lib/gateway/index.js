const GladysGatewayClient = require('@gladysassistant/gladys-gateway-js');
const { webcrypto } = require('crypto');

const logger = require('../../utils/logger');
const { EVENTS, JOB_TYPES } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const { backup } = require('./gateway.backup');
const { forwardDeviceStateToAlexa } = require('./gateway.forwardDeviceStateToAlexa');
const { forwardDeviceStateToGoogleHome } = require('./gateway.forwardDeviceStateToGoogleHome');
const { checkIfBackupNeeded } = require('./gateway.checkIfBackupNeeded');
const { handleGoogleHomeMessage } = require('./gateway.handleGoogleHomeMessage');
const { handleAlexaMessage } = require('./gateway.handleAlexaMessage');
const { handleMCPMessage } = require('./gateway.handleMCPMessage');
const { handleNewMessage } = require('./gateway.handleNewMessage');
const { login } = require('./gateway.login');
const { loginTwoFactor } = require('./gateway.loginTwoFactor');
const { init } = require('./gateway.init');
const { getStatus } = require('./gateway.getStatus');
const { getBackups } = require('./gateway.getBackups');
const { getInstanceKeysFingerprint } = require('./gateway.getInstanceKeysFingerprint');
const { getUsersKeys } = require('./gateway.getUsersKeys');
const { getLatestGladysVersion } = require('./gateway.getLatestGladysVersion');
const { downloadBackup } = require('./gateway.downloadBackup');
const { disconnect } = require('./gateway.disconnect');
const { forwardWebsockets } = require('./gateway.forwardWebsockets');
const { restoreBackup } = require('./gateway.restoreBackup');
const { restoreBackupEvent } = require('./gateway.restoreBackupEvent');
const { saveUsersKeys } = require('./gateway.saveUsersKeys');
const { refreshUserKeys } = require('./gateway.refreshUserKeys');
const { getEcowattSignals } = require('./gateway.getEcowattSignals');
const { getEdfTempo } = require('./gateway.getEdfTempo');
const { getEdfTempoHistorical } = require('./gateway.getEdfTempoHistorical');
const { getTTSApiUrl } = require('./gateway.getTTSApiUrl');
const { stt } = require('./gateway.stt');
const { processVoiceMessage } = require('./gateway.processVoiceMessage');
const { aiChat } = require('./gateway.aiChat');
const { getOpenAIQuota } = require('./gateway.getOpenAIQuota');
const { forwardMessageToAiChat } = require('./gateway.forwardMessageToAiChat');
const { getAiChatDebugContext } = require('./gateway.getAiChatDebugContext');
const { buildWeeklyDigestData } = require('./gateway.buildWeeklyDigestData');
const { sendWeeklyDigest } = require('./gateway.sendWeeklyDigest');
const { scheduleWeeklyDigest } = require('./gateway.scheduleWeeklyDigest');

// Enedis API
const { enedisGetConsumptionLoadCurve } = require('./enedis/gateway.enedisGetConsumptionLoadCurve');
const { enedisGetDailyConsumption } = require('./enedis/gateway.enedisGetDailyConsumption');
const { enedisGetDailyConsumptionMaxPower } = require('./enedis/gateway.enedisGetDailyConsumptionMaxPower');

const Gateway = function Gateway(
  variable,
  event,
  system,
  sequelize,
  config,
  user,
  stateManager,
  serviceManager,
  job,
  scheduler,
  message,
  brain,
  device = null,
) {
  this.variable = variable;
  this.event = event;
  this.system = system;
  this.sequelize = sequelize;
  this.scheduler = scheduler;
  this.config = config;
  this.user = user;
  this.stateManager = stateManager;
  this.serviceManager = serviceManager;
  this.job = job;
  this.message = message;
  this.brain = brain;
  this.device = device;
  this.scene = null;
  this.connected = false;
  this.restoreInProgress = false;
  this.usersKeys = [];
  this.googleHomeConnected = false;
  this.alexaConnected = false;
  this.forwardStateToGoogleHomeTimeouts = new Map();
  this.forwardStateToAlexaTimeouts = new Map();
  this.googleHomeForwardStateTimeout = 5 * 1000;
  this.alexaForwardStateTimeout = 5 * 1000;
  this.backupRandomInterval = 2 * 60 * 60 * 1000; // 2 hours
  this.getLatestGladysVersionInitTimeout = 5 * 60 * 1000; // 5 minutes
  this.GladysGatewayClient = GladysGatewayClient;
  this.gladysGatewayClient = new GladysGatewayClient({
    cryptoLib: webcrypto,
    serverUrl: config.gladysGatewayServerUrl,
    logger,
  });
  this.backup = this.job.wrapper(JOB_TYPES.GLADYS_GATEWAY_BACKUP, this.backup.bind(this));
  this.sendWeeklyDigest = this.job.wrapper(JOB_TYPES.AI_WEEKLY_DIGEST, this.sendWeeklyDigest.bind(this));

  this.event.on(EVENTS.GATEWAY.CREATE_BACKUP, eventFunctionWrapper(this.backup.bind(this)));
  this.event.on(EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED, eventFunctionWrapper(this.checkIfBackupNeeded.bind(this)));
  this.event.on(EVENTS.GATEWAY.RESTORE_BACKUP, eventFunctionWrapper(this.restoreBackupEvent.bind(this)));
  this.event.on(EVENTS.SYSTEM.CHECK_UPGRADE, eventFunctionWrapper(this.getLatestGladysVersion.bind(this)));
  this.event.on(EVENTS.WEBSOCKET.SEND_ALL, eventFunctionWrapper(this.forwardWebsockets.bind(this)));
  this.event.on(EVENTS.WEBSOCKET.SEND, eventFunctionWrapper(this.forwardWebsockets.bind(this)));
  this.event.on(EVENTS.GATEWAY.USER_KEYS_CHANGED, eventFunctionWrapper(this.refreshUserKeys.bind(this)));
  this.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.forwardDeviceStateToGoogleHome.bind(this)));
  this.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.forwardDeviceStateToAlexa.bind(this)));
  this.event.on(EVENTS.MESSAGE.NEW_FOR_OPEN_AI, eventFunctionWrapper(this.forwardMessageToAiChat.bind(this)));
  this.event.on(EVENTS.GATEWAY.SEND_WEEKLY_DIGEST, eventFunctionWrapper(this.sendWeeklyDigest.bind(this)));
};

Gateway.prototype.backup = backup;
Gateway.prototype.checkIfBackupNeeded = checkIfBackupNeeded;
Gateway.prototype.handleGoogleHomeMessage = handleGoogleHomeMessage;
Gateway.prototype.handleAlexaMessage = handleAlexaMessage;
Gateway.prototype.handleMCPMessage = handleMCPMessage;
Gateway.prototype.forwardDeviceStateToAlexa = forwardDeviceStateToAlexa;
Gateway.prototype.forwardDeviceStateToGoogleHome = forwardDeviceStateToGoogleHome;
Gateway.prototype.handleNewMessage = handleNewMessage;
Gateway.prototype.login = login;
Gateway.prototype.loginTwoFactor = loginTwoFactor;
Gateway.prototype.init = init;
Gateway.prototype.getStatus = getStatus;
Gateway.prototype.getBackups = getBackups;
Gateway.prototype.getInstanceKeysFingerprint = getInstanceKeysFingerprint;
Gateway.prototype.getUsersKeys = getUsersKeys;
Gateway.prototype.getLatestGladysVersion = getLatestGladysVersion;
Gateway.prototype.downloadBackup = downloadBackup;
Gateway.prototype.disconnect = disconnect;
Gateway.prototype.forwardWebsockets = forwardWebsockets;
Gateway.prototype.restoreBackup = restoreBackup;
Gateway.prototype.restoreBackupEvent = restoreBackupEvent;
Gateway.prototype.saveUsersKeys = saveUsersKeys;
Gateway.prototype.refreshUserKeys = refreshUserKeys;
Gateway.prototype.getEcowattSignals = getEcowattSignals;
Gateway.prototype.getEdfTempo = getEdfTempo;
Gateway.prototype.getEdfTempoHistorical = getEdfTempoHistorical;
Gateway.prototype.aiChat = aiChat;
Gateway.prototype.getOpenAIQuota = getOpenAIQuota;
Gateway.prototype.forwardMessageToAiChat = forwardMessageToAiChat;
Gateway.prototype.getAiChatDebugContext = getAiChatDebugContext;
Gateway.prototype.buildWeeklyDigestData = buildWeeklyDigestData;
Gateway.prototype.sendWeeklyDigest = sendWeeklyDigest;
Gateway.prototype.scheduleWeeklyDigest = scheduleWeeklyDigest;

// Enedis API
Gateway.prototype.enedisGetConsumptionLoadCurve = enedisGetConsumptionLoadCurve;
Gateway.prototype.enedisGetDailyConsumption = enedisGetDailyConsumption;
Gateway.prototype.enedisGetDailyConsumptionMaxPower = enedisGetDailyConsumptionMaxPower;

// TTS API
Gateway.prototype.getTTSApiUrl = getTTSApiUrl;

// STT API
Gateway.prototype.stt = stt;
Gateway.prototype.processVoiceMessage = processVoiceMessage;

module.exports = Gateway;
