const Promise = require('bluebird');

const { getTpLinkPlug } = require('../models/plug');
const { getTpLinkBulb } = require('../models/bulb');
const { getTpLinkDevice } = require('../models/device');

/**
 * @description Get all devices.
 * @returns {Promise} Array of devices.
 * @example
 * getDevices();
 */
async function getDevices() {
  const devicesToReturn = [];

  this.client.startDiscovery({ discoveryTimeout: 1900 }).on('device-online', (device) => {
    device.getSysInfo().then((deviceSysInfo) => {
      switch (deviceSysInfo.type) {
        case 'IOT.SMARTPLUGSWITCH':
        case 'IOT.RANGEEXTENDER.SMARTPLUG':
          devicesToReturn.push(getTpLinkPlug(device, deviceSysInfo, this.serviceId));
          break;
        case 'IOT.SMARTBULB':
          devicesToReturn.push(getTpLinkBulb(device, deviceSysInfo, this.serviceId));
          break;
        default:
          devicesToReturn.push(getTpLinkDevice(device, deviceSysInfo, this.serviceId));
      }
    });
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(devicesToReturn);
    }, 2000);
  });
}

module.exports = {
  getDevices,
};
