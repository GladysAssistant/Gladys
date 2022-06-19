const os = require('os');
const path = require('path');
const logger = require('../../../../utils/logger');

const { driverReady } = require('../events/zwave.driverReady');
const { nodeAdded } = require('../events/zwave.nodeAdded');
const { nodeRemoved } = require('../events/zwave.nodeRemoved');
const { nodeReady } = require('../events/zwave.nodeReady');
const { scanComplete } = require('../events/zwave.scanComplete');
const { DEFAULT } = require('../constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');

const DRIVER_READY_TIMEOUT = 60 * 1000;

/**
 * @description Connect to Zwave USB driver.
 * @param {string} zwaveDriverPath - Path to the USB driver.
 * @param {Object} securityKeys - Zwave security keys.
 * @returns {Promise} Void.
 * @example
 * zwave.connectZwaveJS(zwaveDriverPath, {});
 */
async function connectZwaveJS(zwaveDriverPath, securityKeys) {
  logger.debug(`Zwave : Connecting to USB = ${zwaveDriverPath}`);
  // special case for macOS
  if (os.platform() === 'darwin') {
    this.zwaveDriverPath = zwaveDriverPath.replace('/dev/tty.', '/dev/cu.');
  } else {
    this.zwaveDriverPath = zwaveDriverPath;
  }
  this.ready = false;

  this.driver = new this.ZWaveJS.Driver(zwaveDriverPath, {
    logConfig: {
      level: 'debug',
      logToFile: true,
      filename: path.resolve(this.gladys.config.servicesFolder('zwave'), 'logs', `zwave-${process.pid}.log`),
      forceConsole: true,
    },
    storage: {
      cacheDir: path.resolve(this.gladys.config.servicesFolder('zwave'), 'cache'),
    },
    securityKeys,
  });
  this.driver.on('error', (e) => {
    logger.debug(`ZWave Error: [${e.name}] ${e.message}`);
  });

  this.driver.on('driver ready', () => {
    driverReady.bind(this)(`${this.driver.controller.homeId}`);
    this.driver.controller.nodes.forEach((node) => {
      nodeAdded.bind(this)(node);
      if (node.ready) {
        nodeReady.bind(this)(node);
      }
    });

    this.driver.controller.on('node added', (node, result) => {
      nodeAdded.bind(this)(node);
    });

    this.driver.controller.on('node removed', (node, replaced) => {
      nodeRemoved.bind(this)(node);
    });

    this.driver.controller.on('heal network progress', (statuses) => {
      statuses.forEach((nodeId, status) => {
        logger.info(`Heal network on-going for node ${nodeId}: ${status}`);
      });
    });
    this.driver.controller.on('heal network done', (statuses) => {
      statuses.forEach((nodeId, status) => {
        logger.info(`Heal network done for node ${nodeId}: ${status}`);
      });
    });
  });

  this.driver.on('all nodes ready', () => {
    this.ready = true;
    scanComplete.bind(this)();
  });

  await this.driver
    .start()
    .then((res) => {
      this.connected = true;
      this.restartRequired = false;
      setTimeout(() => {
        scanComplete.bind(this)();
      }, DRIVER_READY_TIMEOUT);
    })
    .catch((e) => logger.fatal(`Unable to start Z-Wave service ${e}`));
}

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connectZwave2mqtt();
 */
async function connectZwave2mqtt() {
  if (this.mqttRunning) {
    this.mqttClient.on('connect', () => {
      logger.info('Connected to MQTT container');
      DEFAULT.TOPICS.forEach((topic) => {
        this.mqttClient.subscribe(topic);
      });
      this.mqttConnected = true;
      this.connected = true;
      this.restartRequired = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.STATUS_CHANGE,
      });
    });

    this.mqttClient.on('error', (err) => {
      logger.warn(`Error while connecting to MQTT - ${err}`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.MQTT_ERROR,
        payload: err,
      });
      this.mqttConnected = false;
    });

    this.mqttClient.on('offline', () => {
      logger.warn(`Disconnected from MQTT server`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
        payload: 'DISCONNECTED',
      });
      this.mqttConnected = false;
    });

    this.mqttClient.on('message', (topic, message) => {
      try {
        this.handleMqttMessage(topic, message.toString());
      } catch (e) {
        logger.error(`Unable to process message on topic ${topic}: ${e}`);
      }
    });

    this.ready = true;
    this.scanInProgress = true;

    // For testing
    const nodes = require('../../../../../nodes_6.json');
    this.handleMqttMessage(
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/driver/driver_ready`,
      '{"data": [{"controllerId":"controllerId","homeId":"homeId"}]}',
    );
    this.handleMqttMessage(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/getNodes`, nodes);

    // this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/getNodes/set`, 'true');

    this.driver = {
      controller: {
        ownNodeId: 'N.A.',
      },
    };
  } else {
    logger.warn("Can't connect Gladys cause MQTT not running !");
  }
}

module.exports = {
  connectZwaveJS,
  connectZwave2mqtt,
};
