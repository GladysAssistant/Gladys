const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const models = require('../models');
const { W215_EXTERNAL_ID_BASE } = require('../utils/constants');

/**
 * @description Retrieve eWelink devices from cloud.
 * @returns {Promise<Array<Object>>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {

  const unknownDevices = [];
  
  // Network scan for device
  const mDnsSd = require('node-dns-sd');
  
  const discoveredDevices = await mDnsSd.discover({name: '_dhnap._tcp.local', filter: 'D-Link'});
  // catch errors
  this.throwErrorIfNeeded(discoveredDevices, true);

  logger.debug(`Discovered devices : "${discoveredDevices.length}"`);
  if (discoveredDevices.length) {
    await Promise.map(discoveredDevices, async (discoveredDevice) => {
      logger.debug(`Device IP ADDRESS : "${discoveredDevice.address}"`);
      logger.debug(`------------MODEL : "${discoveredDevice.packet.answers[1].rdata.model_number}"`);
      logger.debug(`------MAC ADDRESS : "${discoveredDevice.packet.answers[1].rdata.mac}"`);
      logger.debug(`--------WLAN SSID : "${discoveredDevice.packet.answers[1].rdata.wlan0_ssid}"`);
      logger.debug(`-------------------`);
      
      // Only DSP-W215 is expected
      if (discoveredDevice.packet.answers[1].rdata.model_number === 'DSP-W215'){
        // External ID = w215:xxx.xxx.xxx.xxx (IP Address)
        const deviceId = `${W215_EXTERNAL_ID_BASE}:${discoveredDevice.address}`;
        discoveredDevice.deviceid = discoveredDevice.address;
        // Nom du device
        discoveredDevice.name = discoveredDevice.packet.answers[1].rdata.wlan0_ssid;
        // Control if device is already in Gladys
        const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
        if (deviceInGladys){
          logger.debug(`Device "${discoveredDevice.deviceid}" is already in Gladys !`);
        } else {
          unknownDevices.push(models.DSPW215.getDevice(this.serviceId, discoveredDevice));
        }
      } else {
        // ...else the device is not yet handled.
        logger.info(`Device model "${discoveredDevice.model}" not handled yet !`);
      }
    });
  }

  return unknownDevices;
}

module.exports = {
  discover,
};
