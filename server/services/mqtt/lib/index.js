const { init } = require('./init');
const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleNewMessage } = require('./handleNewMessage');
const { handleGladysMessage } = require('./handler/handleGladysMessage');
const { handleDeviceCustomTopicMessage } = require('./handler/handleDeviceCustomTopicMessage');
const { publish } = require('./publish');
const { subscribe } = require('./subscribe');
const { unsubscribe } = require('./unsubscribe');
const { status } = require('./status');
const { getConfiguration } = require('./getConfiguration');
const { saveConfiguration } = require('./saveConfiguration');
const { installContainer } = require('./installContainer');
const { listenToCustomMqttTopicIfNeeded } = require('./listenToCustomMqttTopicIfNeeded');
const { unListenToCustomMqttTopic } = require('./unListenToCustomMqttTopic');
const { configureContainer } = require('./configureContainer');
const { updateContainer } = require('./updateContainer');
const { checkDockerNetwork } = require('./checkDockerNetwork');
const { setValue } = require('./setValue');
const { setDebugMode } = require('./setDebugMode');
const { postCreate, postUpdate, postDelete } = require('./postCreate');
const {
  handleHomeAssistantDiscoveryMessage,
  emitHomeAssistantDiscoveredDevices,
  removeHomeAssistantEntitiesFromTopic,
  registerHomeAssistantEntity,
} = require('./homeAssistant/handleHomeAssistantDiscoveryMessage');
const { getHomeAssistantDiscoveredDevices } = require('./homeAssistant/getHomeAssistantDiscoveredDevices');
const {
  listenToHomeAssistantDeviceStateIfNeeded,
  unListenToHomeAssistantDevice,
} = require('./homeAssistant/listenToHomeAssistantDevice');
const { handleHomeAssistantStateMessage } = require('./homeAssistant/handleHomeAssistantStateMessage');
const { setValueHomeAssistant } = require('./homeAssistant/setValueHomeAssistant');

/**
 * @description Add ability to connect to a MQTT broker.
 * @param {object} gladys - Gladys instance.
 * @param {object} mqttLibrary - MQTT lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const mqttHandler = new MqttHandler(gladys, client, serviceId);
 */
const MqttHandler = function MqttHandler(gladys, mqttLibrary, serviceId) {
  this.gladys = gladys;
  this.mqttLibrary = mqttLibrary;
  this.serviceId = serviceId;
  this.mqttClient = null;

  this.topicBinds = {};
  this.deviceFeatureCustomMqttTopics = [];
  // Home Assistant discovery
  this.haDiscoveredDevices = {};
  this.haEntitiesByTopic = {};
  this.haStateBindings = {};
  this.haDiscoveryEmitTimeout = null;
  this.configured = false;
  this.connected = false;
  this.debugMode = false;
  this.debugModeTimeout = 120 * 1000;
};

MqttHandler.prototype.init = init;
MqttHandler.prototype.connect = connect;
MqttHandler.prototype.disconnect = disconnect;
MqttHandler.prototype.handleNewMessage = handleNewMessage;
MqttHandler.prototype.handleGladysMessage = handleGladysMessage;
MqttHandler.prototype.handleDeviceCustomTopicMessage = handleDeviceCustomTopicMessage;
MqttHandler.prototype.publish = publish;
MqttHandler.prototype.subscribe = subscribe;
MqttHandler.prototype.unsubscribe = unsubscribe;
MqttHandler.prototype.status = status;
MqttHandler.prototype.getConfiguration = getConfiguration;
MqttHandler.prototype.saveConfiguration = saveConfiguration;
MqttHandler.prototype.installContainer = installContainer;
MqttHandler.prototype.listenToCustomMqttTopicIfNeeded = listenToCustomMqttTopicIfNeeded;
MqttHandler.prototype.unListenToCustomMqttTopic = unListenToCustomMqttTopic;
MqttHandler.prototype.configureContainer = configureContainer;
MqttHandler.prototype.updateContainer = updateContainer;
MqttHandler.prototype.checkDockerNetwork = checkDockerNetwork;
MqttHandler.prototype.setValue = setValue;
MqttHandler.prototype.setDebugMode = setDebugMode;
MqttHandler.prototype.postCreate = postCreate;
MqttHandler.prototype.postUpdate = postUpdate;
MqttHandler.prototype.postDelete = postDelete;
MqttHandler.prototype.handleHomeAssistantDiscoveryMessage = handleHomeAssistantDiscoveryMessage;
MqttHandler.prototype.emitHomeAssistantDiscoveredDevices = emitHomeAssistantDiscoveredDevices;
MqttHandler.prototype.removeHomeAssistantEntitiesFromTopic = removeHomeAssistantEntitiesFromTopic;
MqttHandler.prototype.registerHomeAssistantEntity = registerHomeAssistantEntity;
MqttHandler.prototype.getHomeAssistantDiscoveredDevices = getHomeAssistantDiscoveredDevices;
MqttHandler.prototype.listenToHomeAssistantDeviceStateIfNeeded = listenToHomeAssistantDeviceStateIfNeeded;
MqttHandler.prototype.unListenToHomeAssistantDevice = unListenToHomeAssistantDevice;
MqttHandler.prototype.handleHomeAssistantStateMessage = handleHomeAssistantStateMessage;
MqttHandler.prototype.setValueHomeAssistant = setValueHomeAssistant;

module.exports = MqttHandler;
