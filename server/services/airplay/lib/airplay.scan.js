const { convertToGladysDevice } = require('../utils/convertToGladysDevice');
const logger = require('../../../utils/logger');

/**
 * @description Scan network for Airplay devices.
 * @returns {Promise} Resolve with discovered devices.
 * @example scan();
 */
async function scan() {
  return new Promise((resolve, reject) => {
    const devices = [];
    const deviceIpAddresses = new Map();

    const browser = this.bonjourLib.find({ type: 'airplay' });

    browser.on('up', (service) => {
      logger.debug('Airplay: Found device "%s" at %s:%d', service.name, service.referer.address, service.port);
      devices.push(convertToGladysDevice(this.serviceId, service));
      deviceIpAddresses.set(service.name, service.referer.address);
    });

    browser.on('error', (err) => {
      logger.error('Airplay: Error during bonjour scan', err);
      browser.stop();
      reject(err);
    });

    // Stop the browser after a certain time to finish the scan
    setTimeout(() => {
      browser.stop();
      this.devices = devices;
      this.deviceIpAddresses = deviceIpAddresses;
      resolve(devices);
    }, this.scanTimeout);

    // Start the browser immediately as bonjour automatically starts
  });
}

module.exports = {
  scan,
};
