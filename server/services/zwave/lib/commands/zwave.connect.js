const os = require('os');
const logger = require('../../../../utils/logger');

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
      level: 'info'
    }
  });
  this.driver.on('error', (e) => {
    logger.debug(`ZWave Error: [${e.name}] ${e.message}`);
  });

  this.driver.on('driver ready', () => {
    this.driverReady(`${this.driver.controller.homeId}`);
    this.driver.controller.nodes.forEach((node) => {
        logger.debug(node);
    });
  });

  this.driver.controller.on('')

  // this.zwave.connect(this.driverPath);
  await this.driver.start();
}

module.exports = {
  connect,
};
