const logger = require('../../../../utils/logger');
const { DEFAULT, COMMAND_CLASSES, GENRE } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

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

  switch (topic) {
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/driver/driver_ready`: {
      const msg = JSON.parse(message).data[0];
      this.driver.homeId = msg.homeId;
      this.driver.controllerId = msg.controllerId;
      this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/driver/all_nodes_ready`: {
      this.scanComplete();
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/controller/statistics_updated`: {
      const msg = JSON.parse(message).data[0];
      this.driver.statistics = msg;
      this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      break;
    }
    /* case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_alive`: {
      const msg = JSON.parse(message).data[0];
      this.nodeAlive(
        {
          id: msg.id,
        },
        msg.data,
      );
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_ready`: {
      const msg = JSON.parse(message).data[0];
      this.nodeReady(
        {
          id: msg.id,
        },
        msg.data,
      );
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_sleep`: {
      const msg = JSON.parse(message).data[0];
      this.nodeSleep({
        id: msg.id,
      });
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_dead`: {
      const msg = JSON.parse(message).data[0];
      this.nodeDead(
        {
          id: msg.id,
        },
        msg.data,
      );
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_wakeup`: {
      const msg = JSON.parse(message).data[0];
      this.nodeWakeUp({
        id: msg.id,
      });
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_value_added`: {
      // Use node topic
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_value_updated`: {
      // Use node topic
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_metadata_updated`: {
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/statistics_updated`: {
      const msg = JSON.parse(message);
      this.statisticsUpdated(
        {
          id: msg.data[0],
        },
        msg.data[1],
      );
      break;
    }
    case `${DEFAULT.ROOT}/driver/status`:
    case `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/status`:
    case `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/version`: {
      break;
    } */
    case `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes`: {
      if (this.scanInProgress) {
        if (!(message instanceof Object)) {
          /* const fs = require('fs');
          try {
            fs.writeFileSync('nodes.json', message);
          } catch (err) {
            console.error(err);
          } */
        }
        const { success, result } = message instanceof Object ? message : JSON.parse(message);
        if (success) {
          this.nodes = {};
          result.forEach((data) => {
            const node = Object.assign(
              {
                nodeId: data.id,
                classes: {},
                values: {},
                ready: false,
                endpoints: data.endpointIndizes.map((idx) => {
                  return {
                    index: idx,
                  };
                }),
              },
              data,
            );

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
        const [, nodeId, commandClass, endpoint, propertyName, propertyKey] = splittedTopic;
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
          // Notification stateless
          break;
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
          if(Number.isNaN(newValue)) {
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
