const mdns = require('mdns');
const { convertToGladysDevice } = require('../utils/convertToGladysDevice');
const logger = require('../../../utils/logger');

/**
 * @description Scan network for Google Cast devices.
 * @returns {Promise} Resolve with discovered devices.
 * @example scan();
 */
async function scan() {
  return new Promise((resolve, reject) => {
    const browser = mdns.createBrowser(mdns.tcp('googlecast'));
    const devices = [];
    const deviceIpAddresses = new Map();

    browser.on('serviceUp', (service) => {
      logger.debug('Google Cast: Found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      devices.push(convertToGladysDevice(this.serviceId, service));
      deviceIpAddresses.set(service.name, service.addresses[0]);
    });

    browser.on('error', (err) => {
      logger.error('Google Cast: Error during mDNS scan', err);
      browser.stop();
      reject(err);
    });

    // Stop the browser after a certain time to finish the scan
    setTimeout(() => {
      browser.stop();
      this.devices = devices;
      this.deviceIpAddresses = deviceIpAddresses;
      resolve(devices);
    }, 5000);

    browser.start();
  });
}

module.exports = {
  scan,
};
