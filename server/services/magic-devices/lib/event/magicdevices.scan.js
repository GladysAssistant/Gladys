const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES
} = require('../../../../utils/constants');

const { SERVICE_SELECTOR } = require('../utils/constants');
const { Discovery } = require('magic-home');
const logger = require('../../../../utils/logger');
const { Error500 } = require('../../../../utils/httpErrors');

const { createDevice } = require('../utils/device');

/**
 * @description Send a broadcast to find the devices
 * @example
 * magicDevices.scan();
 */
async function scan() {

  let response = 'NO DEVICES FOUND WHILE SCANNING';
  let discovery = new Discovery();
  await discovery.scan(5000, async (error, discoveredDevices) => {

    console.log("SCAN RESULT: ", JSON.stringify(error), JSON.stringify(discoveredDevices))

    if (error !== null) {
      throw new Error500(error);
    }

    if (discoveredDevices.length) {      
      console.debug(discoveredDevices.length + ' Magic Device(s) found while scanning !');
      const unknownDevices = await this.mapKnownDevicesWithGladys(discoveredDevices);

      if (unknownDevices.length) {

        console.log(JSON.stringify(unknownDevices))

        for (let d in unknownDevices) {
          const scannedDevice = unknownDevices[d];
          const newDevice = createDevice(scannedDevice, this.serviceId);
          this.deviceIpByMacAdress.set(scannedDevice.id, scannedDevice.address);
          this.devices[scannedDevice.id] = newDevice;

          // create device in DB and stuff
          this.gladys.device.create(newDevice);

          // emit NEW DEVICE event
          this.gladys.event.emit(EVENTS.DEVICE.NEW, newDevice);
          
        }

        response = "FOUND DEVICES WHILE SCANNING";
      } else {
        response = "FOUND DEVICES WHILE SCANNING, GLADYS ALREADY KNOWS THEM";
      }
    }

  });

  return response;
}

module.exports = {
  scan,
};
