const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { statisticsUpdated } = require('./statisticsUpdated');
const { valueUpdated } = require('./valueUpdated');
const { valueAdded } = require('./valueAdded');
const { nodeDead, nodeAlive, nodeWakeUp, nodeSleep } = require('./nodeState');
const { nodeReady } = require('./nodeReady');
const { DEFAULT, COMMAND_CLASSES, GENRE } = require('../constants');
const { scanComplete } = require('./scanComplete');
const { driverReady } = require('../../../zwave/lib/events/zwave.driverReady');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @returns {Object} Null.
 * @example
 * handleMqttMessage('zwavejs2mqtt/POWER', 'ON');
 */
function handleMqttMessage(topic, message) {
  this.mqttConnected = true;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
  });

  switch (topic) {
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/driver/driver_ready`: {
      const msg = JSON.parse(message).data[0];
      this.driver.homeId = msg.homeId;
      this.driver.ownNodeId = msg.controllerId;
      driverReady.bind(this)(msg.homeId);
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/driver/all_nodes_ready`: {
      scanComplete.bind(this)();
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/controller/statistics_updated`: {
      const msg = JSON.parse(message).data[0];
      this.driver.statistics = msg;
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_alive`: {
      const msg = JSON.parse(message).data[0];
      nodeAlive.bind(this)(
        {
          id: msg.id,
        },
        msg.data,
      );
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_ready`: {
      const msg = JSON.parse(message).data[0];
      nodeReady.bind(this)(
        {
          id: msg.id,
        },
        msg.data,
      );
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_sleep`: {
      const msg = JSON.parse(message).data[0];
      nodeSleep.bind(this)({
        id: msg.id,
      });
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_dead`: {
      const msg = JSON.parse(message).data[0];
      nodeDead.bind(this)(
        {
          id: msg.id,
        },
        msg.data,
      );
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_wakeup`: {
      const msg = JSON.parse(message).data[0];
      nodeWakeUp.bind(this)({
        id: msg.id,
      });
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_value_added`: {
      // Use node topic
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_value_updated`: {
      // Use node topic
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/node_metadata_updated`: {
      // Use node topic
      /* const msg = JSON.parse(message).data[0];
      metadataUpdate.bind(this)(
        {
          id: msg.id,
        },
        msg.data,
      ); */
      break;
    }
    case `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/node/statistics_updated`: {
      const msg = JSON.parse(message);
      statisticsUpdated.bind(this)(
        {
          id: msg.data[0],
        },
        msg.data[1],
      );
      break;
    }
    case `${DEFAULT.ROOT}/driver/status`:
    case `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/status`:
    case `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/version`: {
      break;
    }
    case `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/getNodes`: {
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

            nodeReady.bind(this)(node);
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

                valueAdded.bind(this)(
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

          scanComplete.bind(this)();
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
        logger.info(`Zwavejs2mqtt scan in progress. Bypass message.`);
      } else if (splittedTopic.length >= 5) {
        const [, nodeId, commandClass, endpoint, propertyName, propertyKey] = splittedTopic;
        if (propertyKey === 'set') {
          // logger.debug(`Zwavejs2mqtt set. Bypass message.`);
          break;
        }
        if (GENRE[commandClass * 1] !== undefined) {
          // logger.debug(`Zwavejs2mqtt command class not supported. Bypass message.`);
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
        } else if (!Number.isNaN(message)) {
          newValue = Number(message);
        } else {
          break;
        }

        valueUpdated.bind(this)(
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
        logger.debug(`Zwavejs2mqtt topic ${topic} not handled.`);
      }
    }
  }
  return null;
}

module.exports = {
  handleMqttMessage,
};
