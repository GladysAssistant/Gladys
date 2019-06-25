const GladysGatewayClient = require('@gladysassistant/gladys-gateway-js');
const WebCrypto = require('node-webcrypto-ossl');
const getConfig = require('../../utils/getConfig');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const serverUrl = getConfig().gladysGatewayServerUrl;
const cryptoLib = new WebCrypto();

const { backup } = require('./gateway.backup');
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
const { restoreBackup } = require('./gateway.restoreBackup');
const { restoreBackupEvent } = require('./gateway.restoreBackupEvent');
const { saveUsersKeys } = require('./gateway.saveUsersKeys');

const Gateway = function Gateway(variable, event, system, sequelize, config) {
  this.variable = variable;
  this.event = event;
  this.system = system;
  this.sequelize = sequelize;
  this.config = config;
  this.connected = false;
  this.restoreInProgress = false;
  this.GladysGatewayClient = GladysGatewayClient;
  this.gladysGatewayClient = new GladysGatewayClient({ cryptoLib, serverUrl, logger });
  this.event.on(EVENTS.GATEWAY.CREATE_BACKUP, eventFunctionWrapper(this.backup.bind(this)));
  this.event.on(EVENTS.GATEWAY.RESTORE_BACKUP, eventFunctionWrapper(this.restoreBackupEvent.bind(this)));
  this.event.on(EVENTS.SYSTEM.CHECK_UPGRADE, eventFunctionWrapper(this.getLatestGladysVersion.bind(this)));
};

Gateway.prototype.backup = backup;
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
Gateway.prototype.restoreBackup = restoreBackup;
Gateway.prototype.restoreBackupEvent = restoreBackupEvent;
Gateway.prototype.saveUsersKeys = saveUsersKeys;

module.exports = Gateway;
