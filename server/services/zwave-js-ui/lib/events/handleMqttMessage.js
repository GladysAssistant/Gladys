const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { DEFAULT, COMMAND_CLASSES, GENRE } = require('../constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {object} message - The message sent.
 * @returns {object} Null.
 * @example
 * handleMqttMessage('zwave-js-ui/POWER', 'ON');
 */
function handleMqttMessage(topic, message) {
  switch (topic) {
    case `${this.mqttTopicPrefix}/driver/status`: {
      const newStatus = message === 'true';
      logger.debug(`Driver status ${newStatus}, was ${this.zwaveJSUIConnected}`);
      if (newStatus !== this.zwaveJSUIConnected) {
        this.zwaveJSUIConnected = newStatus;
        this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
        });
      }
      break;
    }
    case `${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/version`: {
      this.zwaveJSUIVersion = JSON.parse(message).value;
      this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      break;
    }
    case `${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes`: {
      const { success, result } = message instanceof Object ? message : JSON.parse(message);
      if (success) {
        this.nodes = {};
        result.forEach((data) => {
          const node = {
            nodeId: data.id,
            classes: {},
            values: {},
            ...data,
          };

          this.nodes[data.id] = node;

          this.nodeReady(node);
          Object.keys(node.values)
            .filter((valueId) => !valueId.startsWith(COMMAND_CLASSES.COMMAND_CLASS_BASIC.toString()))
            .forEach((valueId) => {
              const value = node.values[valueId];
              if (value.property) {
                value.property = value.property.toString().replace(/_/g, ' ');
              } else {
                value.property = value.propertyName.replace(/_/g, ' ');
              }
              delete value.propertyName;
              value.propertyKey = value.propertyKey ? `${value.propertyKey}`.replace(/_/g, ' ') : undefined;

              this.valueAdded(
                {
                  id: data.id,
                },
                value,
              );
            });

          // Clean node
          delete node.id;
          delete node.values;
          delete node.groups;
          delete node.deviceConfig;
        });

        this.scanComplete();
      } else {
        logger.warn(`Error getting nodes, retry in ${DEFAULT.SCAN_NETWORK_RETRY_TIMEOUT}ms`);
        setTimeout(this.scanNetwork.bind(this), DEFAULT.SCAN_NETWORK_RETRY_TIMEOUT);
      }
      break;
    }
    default: {
      // <mqtt_prefix>/<?node_location>/<nodeId>/<commandClass>/<endpoint>/<property>/<propertyKey>
      const splittedTopic = topic.split('/');
      if (splittedTopic[1] === '_CLIENTS') {
        // Nothing to do
      } else if (splittedTopic[1] === '_EVENTS') {
        // Nothing to do
      } else if (splittedTopic[2] === 'status') {
        break;
      } else if (splittedTopic[2] === 'nodeinfo') {
        break;
      } else if (splittedTopic.length >= 5) {
        splittedTopic.shift();
        if (this.mqttTopicWithLocation) {
          splittedTopic.shift();
        }
        const [nodeId, commandClass, endpoint, propertyName, propertyKey] = splittedTopic;
        if (propertyKey === 'set') {
          // logger.debug(`ZwaveJSUI set. Bypass message.`);
          break;
        }
        if (GENRE[commandClass * 1] !== undefined) {
          // logger.debug(`ZwaveJSUI command class not supported. Bypass message.`);
          break;
        }
        const id = nodeId.split('_')[1] * 1;

        logger.debug(`Topic ${topic}: messsage "${message}"`);

        let newValue = message;
        if (message === '') {
          newValue = '';
        } else if (message === 'false') {
          newValue = false;
        } else if (message === 'true') {
          newValue = true;
        } else {
          try {
            newValue = Number(message);
          } catch (e) {
            break;
          }
          if (Number.isNaN(newValue)) {
            break;
          }
        }

        this.valueUpdated(
          {
            id,
          },
          {
            commandClass: commandClass * 1,
            endpoint: endpoint * 1 || 0,
            property: propertyName.replace(/_/g, ' '),
            propertyKey: propertyKey ? `${propertyKey}`.replace(/_/g, ' ') : undefined,
            newValue,
          },
        );
      } else {
        logger.debug(`ZwaveJSUI topic ${topic} not handled.`);
      }
    }
  }

  return null;
}

module.exports = {
  handleMqttMessage,
};
