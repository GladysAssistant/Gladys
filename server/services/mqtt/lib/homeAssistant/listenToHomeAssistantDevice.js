const logger = require('../../../../utils/logger');
const { HOME_ASSISTANT, FEATURE_PROPERTIES } = require('./constants');
const { convertEntityToFeatures } = require('./convertToGladysDevice');

/**
 * @description Get the state topic to listen to for a given feature property.
 * @param {string} component - Home Assistant component (light, sensor...).
 * @param {string} property - Feature property (state, brightness...).
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {string} The topic to listen to, or undefined.
 * @example
 * getStateTopic('light', 'brightness', { brightness_state_topic: 'my/topic' });
 */
function getStateTopic(component, property, config) {
  if (component === 'light' && config.schema !== 'json') {
    switch (property) {
      case FEATURE_PROPERTIES.BRIGHTNESS:
        return config.brightness_state_topic;
      case FEATURE_PROPERTIES.COLOR_TEMP:
        return config.color_temp_state_topic;
      case FEATURE_PROPERTIES.COLOR:
        return config.rgb_state_topic;
      default:
        return config.state_topic;
    }
  }
  if (component === 'cover' && property === FEATURE_PROPERTIES.POSITION) {
    return config.position_topic;
  }
  if (component === 'climate') {
    return property === FEATURE_PROPERTIES.CURRENT_TEMPERATURE
      ? config.current_temperature_topic
      : config.temperature_state_topic;
  }
  return config.state_topic;
}

/**
 * @description Check if a state topic advertised in a discovery payload can be subscribed to.
 * A state topic is a subscription filter, so "+" is valid there: Theengs gateways advertise
 * topics such as "+/+/BTtoMQTT/<id>" so that several gateways can publish the state of the
 * same sensor. A discovery payload is untrusted input though, so filters that would pull in
 * traffic far beyond the device they claim to describe are still refused: "#", which matches
 * every remaining level, and filters without a single concrete level ("+", "+/+"...).
 * A discovery payload can also hold anything in "state_topic" ({}, true, 1...), so this
 * helper never assumes a string and never throws: it just refuses what it cannot subscribe to.
 * @param {any} topic - The state topic advertised in the discovery payload.
 * @returns {boolean} True when the topic can be subscribed to.
 * @example
 * isSubscribableStateTopic('+/+/BTtoMQTT/A4C138800021');
 */
function isSubscribableStateTopic(topic) {
  if (typeof topic !== 'string' || topic.length === 0 || topic.includes('#')) {
    return false;
  }
  const levels = topic.split('/');
  // "+" is a wildcard only when it takes a whole level: "foo+bar" is not a valid filter
  return levels.every((level) => level === '+' || !level.includes('+')) && levels.some((level) => level !== '+');
}

/**
 * @description Stop listening to the state topics of a Home Assistant device.
 * @param {object} device - Gladys device.
 * @example
 * unListenToHomeAssistantDevice(device);
 */
function unListenToHomeAssistantDevice(device) {
  Object.keys(this.haStateBindings).forEach((topic) => {
    const remainingBindings = this.haStateBindings[topic].filter(
      (binding) => binding.deviceExternalId !== device.external_id,
    );
    if (remainingBindings.length === 0) {
      delete this.haStateBindings[topic];
      this.unsubscribe(topic);
    } else {
      this.haStateBindings[topic] = remainingBindings;
    }
  });
}

/**
 * @description Listen to the state topics of a device created through
 * the Home Assistant discovery protocol.
 * @param {object} device - Gladys device.
 * @example
 * listenToHomeAssistantDeviceStateIfNeeded(device);
 */
function listenToHomeAssistantDeviceStateIfNeeded(device) {
  if (!device.external_id || !device.external_id.startsWith(`${HOME_ASSISTANT.EXTERNAL_ID_PREFIX}:`)) {
    return;
  }

  // Remove previous bindings of this device, to stay idempotent on device update
  this.unListenToHomeAssistantDevice(device);

  const params = device.params || [];
  const features = device.features || [];

  params
    .filter((param) => param.name.startsWith(HOME_ASSISTANT.DEVICE_PARAM_PREFIX))
    .forEach((param) => {
      const entityKey = param.name.substring(HOME_ASSISTANT.DEVICE_PARAM_PREFIX.length);
      let config;
      try {
        config = JSON.parse(param.value);
      } catch (e) {
        logger.warn(`MQTT Home Assistant: invalid entity configuration on device ${device.selector} (${entityKey})`);
        return;
      }
      const [component] = entityKey.split(':');
      const externalIdBase = `${device.external_id}:${entityKey}`;

      convertEntityToFeatures(device.external_id, entityKey, config).forEach((builtFeature) => {
        // Only listen for features the user actually created in Gladys
        const featureExists = features.some((feature) => feature.external_id === builtFeature.external_id);
        if (!featureExists) {
          return;
        }
        const property =
          builtFeature.external_id === externalIdBase
            ? FEATURE_PROPERTIES.STATE
            : builtFeature.external_id.substring(externalIdBase.length + 1);
        const topic = getStateTopic(component, property, config);
        if (!topic) {
          return;
        }
        if (!isSubscribableStateTopic(topic)) {
          logger.warn(`MQTT Home Assistant: ignoring state topic ${topic}, this filter is invalid or too broad`);
          return;
        }
        if (!this.haStateBindings[topic]) {
          this.haStateBindings[topic] = [];
          // The callback is bound to the filter it was subscribed with: handleNewMessage
          // dispatches a message to every matching filter, so each one must only handle
          // the bindings it holds itself
          this.subscribe(topic, (receivedTopic, receivedMessage) =>
            this.handleHomeAssistantStateMessage(receivedTopic, receivedMessage, topic),
          );
        }
        this.haStateBindings[topic].push({
          deviceExternalId: device.external_id,
          featureExternalId: builtFeature.external_id,
          component,
          property,
          config,
        });
        logger.debug(`MQTT Home Assistant: listening to ${topic} for feature ${builtFeature.external_id}`);
      });
    });
}

module.exports = {
  listenToHomeAssistantDeviceStateIfNeeded,
  unListenToHomeAssistantDevice,
  getStateTopic,
};
