const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { HOME_ASSISTANT, SUPPORTED_COMPONENTS } = require('./constants');
const { expandHomeAssistantConfig } = require('./expandHomeAssistantConfig');

// homeassistant/<component>/[<node_id>/]<object_id>/config
const DISCOVERY_TOPIC_REGEX = new RegExp(
  `^${HOME_ASSISTANT.DISCOVERY_TOPIC_PREFIX}/([^/]+)/(?:([^/]+)/)?([^/]+)/config$`,
);

/**
 * @description Get the unique identifier of the device a discovery config belongs to.
 * @param {object} config - Expanded discovery configuration.
 * @param {string} nodeId - Optional node id from the discovery topic.
 * @param {string} objectId - Object id from the discovery topic.
 * @returns {string} The device identifier.
 * @example
 * getDeviceIdentifier({ device: { identifiers: ['0x1234'] } }, undefined, 'my-sensor');
 */
function getDeviceIdentifier(config, nodeId, objectId) {
  const device = config.device || {};
  let identifier;
  if (Array.isArray(device.identifiers)) {
    [identifier] = device.identifiers;
  } else if (typeof device.identifiers === 'string') {
    identifier = device.identifiers;
  } else if (Array.isArray(device.connections) && Array.isArray(device.connections[0])) {
    identifier = device.connections[0].join('-');
  }
  // Fallback on the discovery topic parts when the payload has no valid device identity
  if (identifier === undefined || identifier === null || identifier === '') {
    identifier = nodeId || objectId;
  }
  // Sanitize the identifier so it can safely be used in external ids & selectors
  return String(identifier).replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * @description Send discovered devices to connected clients, debounced to
 * avoid flooding the websocket when retained configs are received in a burst.
 * @example
 * this.emitHomeAssistantDiscoveredDevices();
 */
function emitHomeAssistantDiscoveredDevices() {
  if (this.haDiscoveryEmitTimeout) {
    clearTimeout(this.haDiscoveryEmitTimeout);
  }
  this.haDiscoveryEmitTimeout = setTimeout(() => {
    this.haDiscoveryEmitTimeout = null;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.HA_DISCOVERY_DEVICES_UPDATED,
      payload: this.getHomeAssistantDiscoveredDevices({ filter_existing: false }),
    });
  }, HOME_ASSISTANT.DISCOVERY_EMIT_DEBOUNCE_MS);
}

/**
 * @description Remove all entities previously discovered on a topic.
 * @param {string} topic - The discovery config topic.
 * @example
 * this.removeHomeAssistantEntitiesFromTopic('homeassistant/sensor/my-sensor/config');
 */
function removeHomeAssistantEntitiesFromTopic(topic) {
  const registered = this.haEntitiesByTopic[topic];
  if (!registered) {
    return;
  }
  const discoveredDevice = this.haDiscoveredDevices[registered.deviceExternalId];
  if (discoveredDevice) {
    registered.entityKeys.forEach((entityKey) => {
      delete discoveredDevice.entities[entityKey];
    });
    if (Object.keys(discoveredDevice.entities).length === 0) {
      delete this.haDiscoveredDevices[registered.deviceExternalId];
    }
  }
  delete this.haEntitiesByTopic[topic];
  this.emitHomeAssistantDiscoveredDevices();
}

/**
 * @description Store a discovered Home Assistant entity.
 * @param {string} identifier - Device identifier.
 * @param {object} deviceInfo - Device information from the discovery payload.
 * @param {string} entityKey - Unique key of the entity.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {object} The registered entity { deviceExternalId, entityKey }.
 * @example
 * this.registerHomeAssistantEntity('my-device', { name: 'My device' }, 'sensor:temp', { state_topic: 'a/topic' });
 */
function registerHomeAssistantEntity(identifier, deviceInfo, entityKey, config) {
  const deviceExternalId = `${HOME_ASSISTANT.EXTERNAL_ID_PREFIX}:${identifier}`;
  if (!this.haDiscoveredDevices[deviceExternalId]) {
    this.haDiscoveredDevices[deviceExternalId] = {
      identifier,
      info: {},
      entities: {},
    };
  }
  const discoveredDevice = this.haDiscoveredDevices[deviceExternalId];
  discoveredDevice.info = { ...discoveredDevice.info, ...deviceInfo };
  discoveredDevice.entities[entityKey] = config;
  return { deviceExternalId, entityKey };
}

/**
 * @description Handle a message received on the Home Assistant discovery topic.
 * See https://www.home-assistant.io/integrations/mqtt/#mqtt-discovery.
 * @param {string} topic - The topic where the message was published.
 * @param {string} message - The discovery message.
 * @example
 * this.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/my-sensor/config', '{"state_topic": "a/topic"}');
 */
function handleHomeAssistantDiscoveryMessage(topic, message) {
  const parsedTopic = topic.match(DISCOVERY_TOPIC_REGEX);
  if (!parsedTopic) {
    // Not a discovery config topic (per-component state topics, status topic...)
    logger.debug(`MQTT Home Assistant: ignoring non-config topic ${topic}`);
    return;
  }
  const [, component, nodeId, objectId] = parsedTopic;

  const isDeviceBasedDiscovery = component === 'device';
  if (!isDeviceBasedDiscovery && !SUPPORTED_COMPONENTS.includes(component)) {
    logger.debug(`MQTT Home Assistant: component ${component} is not supported`);
    return;
  }

  // An empty payload removes the entity (or the whole device in device-based discovery)
  if (!message || message.length === 0) {
    this.removeHomeAssistantEntitiesFromTopic(topic);
    return;
  }

  let config;
  try {
    config = expandHomeAssistantConfig(JSON.parse(message));
  } catch (e) {
    logger.warn(`MQTT Home Assistant: unable to parse discovery message on topic ${topic}`);
    logger.warn(e);
    return;
  }

  // Remove entities previously registered on this topic, they are replaced by this config
  const previouslyRegistered = this.haEntitiesByTopic[topic];
  if (previouslyRegistered) {
    const previousDevice = this.haDiscoveredDevices[previouslyRegistered.deviceExternalId];
    if (previousDevice) {
      previouslyRegistered.entityKeys.forEach((entityKey) => {
        delete previousDevice.entities[entityKey];
      });
      if (Object.keys(previousDevice.entities).length === 0) {
        delete this.haDiscoveredDevices[previouslyRegistered.deviceExternalId];
      }
    }
  }

  const identifier = getDeviceIdentifier(config, nodeId, objectId);
  const entityKeys = [];
  let deviceExternalId;

  if (isDeviceBasedDiscovery) {
    // Device-based discovery: a single config describes all components of the device
    // https://www.home-assistant.io/integrations/mqtt/#device-discovery-payload
    const { components = {}, device: deviceInfo, origin, ...sharedConfig } = config;
    Object.keys(components).forEach((componentKey) => {
      // Share the "~" base topic of the device with each component
      const rawComponent = config['~'] ? { '~': config['~'], ...components[componentKey] } : components[componentKey];
      const componentConfig = expandHomeAssistantConfig(rawComponent);
      const { platform } = componentConfig;
      if (!SUPPORTED_COMPONENTS.includes(platform)) {
        logger.debug(`MQTT Home Assistant: component ${platform} is not supported`);
        return;
      }
      const entityKey = `${platform}:${objectId}:${componentKey}`;
      const entityConfig = { ...sharedConfig, ...componentConfig };
      const registered = this.registerHomeAssistantEntity(identifier, deviceInfo, entityKey, entityConfig);
      deviceExternalId = registered.deviceExternalId;
      entityKeys.push(entityKey);
    });
  } else {
    const entityKey = `${component}:${nodeId ? `${nodeId}:` : ''}${objectId}`;
    const registered = this.registerHomeAssistantEntity(identifier, config.device, entityKey, config);
    deviceExternalId = registered.deviceExternalId;
    entityKeys.push(entityKey);
  }

  if (entityKeys.length === 0) {
    delete this.haEntitiesByTopic[topic];
    if (previouslyRegistered) {
      // The previous entities of this topic were removed and not replaced
      this.emitHomeAssistantDiscoveredDevices();
    }
    return;
  }

  this.haEntitiesByTopic[topic] = { deviceExternalId, entityKeys };
  logger.debug(`MQTT Home Assistant: discovered entities ${entityKeys.join(', ')} on device ${deviceExternalId}`);
  this.emitHomeAssistantDiscoveredDevices();
}

module.exports = {
  handleHomeAssistantDiscoveryMessage,
  emitHomeAssistantDiscoveredDevices,
  removeHomeAssistantEntitiesFromTopic,
  registerHomeAssistantEntity,
  getDeviceIdentifier,
};
