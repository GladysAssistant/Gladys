const os = require('os');
const logger = require('../../../../utils/logger');

const { driverReady } = require('../events/zwave.driverReady');
const { nodeAdded } = require('../events/zwave.nodeAdded');
const { nodeRemoved } = require('../events/zwave.nodeRemoved');
const { nodeReady } = require('../events/zwave.nodeReady');

/**
 * @description Connect to Zwave USB driver
 * @param {string} driverPath - Path to the USB driver.
 * @example
 * zwave.connect(driverPath);
 */
async function connect(driverPath) {
  const ZWaveJS = require('zwave-js');

  logger.debug(`Zwave : Connecting to USB = ${driverPath}`);
  // special case for macOS
  if (os.platform() === 'darwin') {
    this.driverPath = driverPath.replace('/dev/tty.', '/dev/cu.');
  } else {
    this.driverPath = driverPath;
  }
  this.ready = false;
  this.driver = new ZWaveJS.Driver(driverPath, {
    logConfig: {
      level: 'info',
    },
  });
  this.driver.on('error', (e) => {
    logger.debug(`ZWave Error: [${e.name}] ${e.message}`);
  });

  this.driver.on('driver ready', () => {
    driverReady.bind(this)(`${this.driver.controller.homeId}`);
    this.driver.controller.nodes.forEach((node) => {
<<<<<<< HEAD
      nodeAdded.bind(this)(node);
      if (node.ready) {
        nodeReady.bind(this)(node);
=======
      nodeAdded.bind(this)(node.id);
      if (node.ready) {
        nodeReady.bind(this)(node.id, node);
>>>>>>> 3b1c7c8c5adead09647fd7a5ca401d85c485c05f
      }
    });

    this.driver.controller.on('node added', (node, result) => {
<<<<<<< HEAD
      nodeAdded.bind(this)(node);
    });

    this.driver.controller.on('node removed', (node, replaced) => {
      nodeRemoved.bind(this)(node);
=======
      nodeAdded.bind(this)(node.id);
    });

    this.driver.controller.on('node removed', (node, replaced) => {
      nodeRemoved.bind(this)(node.id);
>>>>>>> 3b1c7c8c5adead09647fd7a5ca401d85c485c05f
    });
  });

  // this.zwave.connect(this.driverPath);
  await this.driver.start();

  this.connected = true;
}

module.exports = {
  connect,
};
