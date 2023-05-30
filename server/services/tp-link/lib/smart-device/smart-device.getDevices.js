const Promise = require('bluebird');
const { getTpLinkPlug } = require('../models/plug');
const { getTpLinkBulb } = require('../models/bulb');
const { getTpLinkDevice } = require('../models/device');

/**
 * @description Remove duplicates by external_id from array.
 * @param {Array} devices - Array to transform.
 * @returns {Array} Array of unique devices.
 * @example
 * uniqById(devices);
 */
function uniqById(devices) {
  return devices.filter((v, i, a) => a.findIndex((t) => t.external_id === v.external_id) === i);
}

/**
 * @description Get all devices.
 * @returns {Promise} Array of devices.
 * @example
 * getDevices();
 */
async function getDevices() {
  const devicesToReturn = [];

  const discovery = this.client.startDiscovery({ discoveryTimeout: 1900, discoveryInterval: 800 });

  discovery.on('device-online', async (device) => {
    const deviceSysInfo = await device.getSysInfo();
    const type = deviceSysInfo.type ? deviceSysInfo.type : deviceSysInfo.mic_type;
    switch (type) {
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

  await Promise.delay(this.discoverDevicesDelay);

  discovery.removeAllListeners('device-online');
  return uniqById(devicesToReturn);
}

module.exports = {
  getDevices,
};
