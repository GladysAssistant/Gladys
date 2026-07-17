const { init } = require('./externalIntegration.init');
const { install } = require('./externalIntegration.install');
const { start } = require('./externalIntegration.start');
const { stop } = require('./externalIntegration.stop');
const { restart } = require('./externalIntegration.restart');
const { uninstall } = require('./externalIntegration.uninstall');
const { get } = require('./externalIntegration.get');
const { getBySelector } = require('./externalIntegration.getBySelector');
const { getLogs } = require('./externalIntegration.getLogs');
const { saveStatus } = require('./externalIntegration.saveStatus');
const { validateManifest } = require('./externalIntegration.validateManifest');
const { buildSelector } = require('./externalIntegration.buildSelector');
const { buildContainerDescriptor } = require('./externalIntegration.buildContainerDescriptor');
const { createIntegrationContainer } = require('./externalIntegration.createIntegrationContainer');
const { ensureNetwork } = require('./externalIntegration.ensureNetwork');
const { getHostApiUrl } = require('./externalIntegration.getHostApiUrl');
const { registerProxyService } = require('./externalIntegration.registerProxyService');
const { clearTimers } = require('./externalIntegration.clearTimers');
const { handleStartupTimeout } = require('./externalIntegration.handleStartupTimeout');
const { isUpdateAvailable } = require('./externalIntegration.isUpdateAvailable');
const { update } = require('./externalIntegration.update');
const { validateToken } = require('./externalIntegration.validateToken');
const { setDiscoveredDevices } = require('./externalIntegration.setDiscoveredDevices');
const { getDiscoveredDevices } = require('./externalIntegration.getDiscoveredDevices');
const { saveStates } = require('./externalIntegration.saveStates');
const { getDevices } = require('./externalIntegration.getDevices');
const { getIntegrationConfig } = require('./externalIntegration.getIntegrationConfig');
const { setIntegrationConfig } = require('./externalIntegration.setIntegrationConfig');
const { getConfigForFront } = require('./externalIntegration.getConfigForFront');
const { saveConfigFromFront } = require('./externalIntegration.saveConfigFromFront');
const { setRunning } = require('./externalIntegration.setRunning');
const { handleHeartbeat } = require('./externalIntegration.handleHeartbeat');
const { integrationConnected } = require('./externalIntegration.integrationConnected');
const { integrationDisconnected } = require('./externalIntegration.integrationDisconnected');
const { sendCommand } = require('./externalIntegration.sendCommand');
const { sendMessage } = require('./externalIntegration.sendMessage');
const { handleCommandResult } = require('./externalIntegration.handleCommandResult');
const { requestScan } = require('./externalIntegration.requestScan');
const { checkHealth } = require('./externalIntegration.checkHealth');
const { scheduleRestart } = require('./externalIntegration.scheduleRestart');
const { createLinkCode } = require('./externalIntegration.createLinkCode');
const { linkContact } = require('./externalIntegration.linkContact');
const { unlinkContact } = require('./externalIntegration.unlinkContact');
const { getContactForUser } = require('./externalIntegration.getContactForUser');
const { getLinkedContacts } = require('./externalIntegration.getLinkedContacts');
const { handleIncomingMessage } = require('./externalIntegration.handleIncomingMessage');
const { refreshIndex } = require('./store/store.refreshIndex');
const { getIndex } = require('./store/store.getIndex');
const { getCatalog } = require('./store/store.getCatalog');
const { fetchManifestFromRepo } = require('./store/store.fetchManifestFromRepo');
const { installFromStore } = require('./store/store.installFromStore');
const { installFromRepoUrl } = require('./store/store.installFromRepoUrl');

/**
 * @description External integration supervisor: complete lifecycle of the
 * community integrations running in locked-down Docker containers
 * (state machine + backoff + health), registry of the integration WebSocket
 * connections, proxy services in the stateManager.
 * @param {object} event - Event manager.
 * @param {object} system - System manager (dockerode).
 * @param {object} serviceManager - Service manager.
 * @param {object} stateManager - State manager.
 * @param {object} device - Device manager.
 * @param {object} variable - Variable manager.
 * @param {string} jwtSecret - Secret to sign integration JWTs.
 * @param {object} cache - In-memory cache (contact link codes).
 * @example
 * const externalIntegration = new ExternalIntegration(event, system, service, stateManager, device, variable, 's');
 */
const ExternalIntegration = function ExternalIntegration(
  event,
  system,
  serviceManager,
  stateManager,
  device,
  variable,
  jwtSecret,
  cache,
) {
  this.event = event;
  this.system = system;
  this.serviceManager = serviceManager;
  this.stateManager = stateManager;
  this.device = device;
  this.variable = variable;
  this.jwtSecret = jwtSecret;
  this.cache = cache;
  this.available = false;
  // serviceId -> WebSocket connection of the integration
  this.connections = new Map();
  // messageId -> { resolve, reject, timer } of commands waiting for their ack
  this.pendingCommands = new Map();
  // serviceId -> in-memory list of discovered devices published by the integration
  this.discoveredDevices = new Map();
  // supervision timers
  this.startupTimers = new Map();
  this.restartTimers = new Map();
  this.stableRunningTimers = new Map();
  this.startedAt = new Map();
  // serviceId -> missed WS pings count
  this.missedPings = new Map();
  // serviceId -> { count, resetAt } sliding rate limit on POST /state
  this.stateRateLimits = new Map();
  this.checkHealthInterval = null;
  // store index cache (see store/ sub-folder)
  this.storeIndex = null;
  this.storeIndexFetchedAt = 0;
  this.storeRefreshInterval = null;
  // storeSlug -> manifest fetched directly from the repo (repo_url installs absent from the index)
  this.repoManifests = new Map();
};

ExternalIntegration.prototype.init = init;
ExternalIntegration.prototype.install = install;
ExternalIntegration.prototype.start = start;
ExternalIntegration.prototype.stop = stop;
ExternalIntegration.prototype.restart = restart;
ExternalIntegration.prototype.uninstall = uninstall;
ExternalIntegration.prototype.get = get;
ExternalIntegration.prototype.getBySelector = getBySelector;
ExternalIntegration.prototype.getLogs = getLogs;
ExternalIntegration.prototype.saveStatus = saveStatus;
ExternalIntegration.prototype.validateManifest = validateManifest;
ExternalIntegration.prototype.buildSelector = buildSelector;
ExternalIntegration.prototype.buildContainerDescriptor = buildContainerDescriptor;
ExternalIntegration.prototype.createIntegrationContainer = createIntegrationContainer;
ExternalIntegration.prototype.ensureNetwork = ensureNetwork;
ExternalIntegration.prototype.getHostApiUrl = getHostApiUrl;
ExternalIntegration.prototype.registerProxyService = registerProxyService;
ExternalIntegration.prototype.clearTimers = clearTimers;
ExternalIntegration.prototype.handleStartupTimeout = handleStartupTimeout;
ExternalIntegration.prototype.isUpdateAvailable = isUpdateAvailable;
ExternalIntegration.prototype.update = update;
ExternalIntegration.prototype.validateToken = validateToken;
ExternalIntegration.prototype.setDiscoveredDevices = setDiscoveredDevices;
ExternalIntegration.prototype.getDiscoveredDevices = getDiscoveredDevices;
ExternalIntegration.prototype.saveStates = saveStates;
ExternalIntegration.prototype.getDevices = getDevices;
ExternalIntegration.prototype.getIntegrationConfig = getIntegrationConfig;
ExternalIntegration.prototype.setIntegrationConfig = setIntegrationConfig;
ExternalIntegration.prototype.getConfigForFront = getConfigForFront;
ExternalIntegration.prototype.saveConfigFromFront = saveConfigFromFront;
ExternalIntegration.prototype.setRunning = setRunning;
ExternalIntegration.prototype.handleHeartbeat = handleHeartbeat;
ExternalIntegration.prototype.integrationConnected = integrationConnected;
ExternalIntegration.prototype.integrationDisconnected = integrationDisconnected;
ExternalIntegration.prototype.sendCommand = sendCommand;
ExternalIntegration.prototype.sendMessage = sendMessage;
ExternalIntegration.prototype.handleCommandResult = handleCommandResult;
ExternalIntegration.prototype.requestScan = requestScan;
ExternalIntegration.prototype.checkHealth = checkHealth;
ExternalIntegration.prototype.scheduleRestart = scheduleRestart;
ExternalIntegration.prototype.createLinkCode = createLinkCode;
ExternalIntegration.prototype.linkContact = linkContact;
ExternalIntegration.prototype.unlinkContact = unlinkContact;
ExternalIntegration.prototype.getContactForUser = getContactForUser;
ExternalIntegration.prototype.getLinkedContacts = getLinkedContacts;
ExternalIntegration.prototype.handleIncomingMessage = handleIncomingMessage;
ExternalIntegration.prototype.refreshIndex = refreshIndex;
ExternalIntegration.prototype.getIndex = getIndex;
ExternalIntegration.prototype.getCatalog = getCatalog;
ExternalIntegration.prototype.fetchManifestFromRepo = fetchManifestFromRepo;
ExternalIntegration.prototype.installFromStore = installFromStore;
ExternalIntegration.prototype.installFromRepoUrl = installFromRepoUrl;

module.exports = ExternalIntegration;
