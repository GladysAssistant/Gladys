const os = require('os');
const path = require('path');
const logger = require('../../../../utils/logger');

const { driverReady } = require('../events/zwave.driverReady');
const { nodeAdded } = require('../events/zwave.nodeAdded');
const { nodeRemoved } = require('../events/zwave.nodeRemoved');
const { nodeReady } = require('../events/zwave.nodeReady');
const { scanComplete } = require('../events/zwave.scanComplete');

const DRIVER_READY_TIMEOUT = 60 * 1000;

/**
 * @description Connect to Zwave USB driver.
 * @param {string} driverPath - Path to the USB driver.
 * @param {Object} securityKeys - Zwave security keys.
 * @returns {Promise} Void.
 * @example
 * zwave.connect(driverPath);
 */
async function connect(driverPath, securityKeys) {
  logger.debug(`Zwave : Connecting to USB = ${driverPath}`);
  // special case for macOS
  if (os.platform() === 'darwin') {
    this.driverPath = driverPath.replace('/dev/tty.', '/dev/cu.');
  } else {
    this.driverPath = driverPath;
  }
  this.ready = false;

  this.driver = new this.ZWaveJS.Driver(driverPath, {
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
    scanComplete.bind(this)();
  });

  await this.driver.start()
    .then((res) => 
      setTimeout(() => {
        scanComplete.bind(this)();
      }, DRIVER_READY_TIMEOUT)
    )
    .catch((e) => logger.fatal(`Unable to start Z-Wave service ${e}`));

  this.connected = true;
}

module.exports = {
  connect,
};
