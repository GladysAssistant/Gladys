const logger = require('../../../../utils/logger');
const { DEFAULT, COMMAND_CLASSES, GENRE } = require('../constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @returns {Object} Null.
 * @example
 * handleMqttMessage('zwave-js-ui/POWER', 'ON');
 */
function handleMqttMessage(topic, message) {
  this.mqttConnected = true;
  this.zwaveJSUIConnected = true;

  switch (topic) {
    case `${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes`: {
      if (this.scanInProgress) {
        const { success, result } = message instanceof Object ? message : JSON.parse(message);
        if (success) {
          this.nodes = {};
          result.forEach((data) => {
            const node = {
              nodeId: data.id,
              classes: {},
              values: {},
              ready: false,
              endpoints: data.endpointIndizes.map((idx) => {
                return {
                  index: idx,
                };
              }),
              ...data,
            };

            this.nodes[data.id] = node;
            node.label = node.productLabel;

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

            delete node.values;
            delete node.groups;
            delete node.deviceConfig;
          });

          this.scanComplete();
        }
      }
      break;
    }
    default: {
      // <mqtt_prefix>/<?node_location>/<nodeId>/<commandClass>/<endpoint>/<property>/<propertyKey>
      const splittedTopic = topic.split('/');
      if (splittedTopic[1] === '_CLIENTS') {
        // Nothing to do
      } else if (splittedTopic[2] === 'status') {
        break;
      } else if (splittedTopic[2] === 'nodeinfo') {
        break;
      } else if (this.scanInProgress) {
        logger.info(`ZwaveJSUI scan in progress. Bypass message.`);
      } else if (splittedTopic.length >= 5) {
        splittedTopic.shift();
        if(this.mqttTopicWithLocation) {
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
