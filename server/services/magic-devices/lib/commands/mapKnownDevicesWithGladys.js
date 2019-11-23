const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES
} = require('../../../../utils/constants');

const { SERVICE_SELECTOR } = require('../utils/constants');

async function mapKnownDevicesWithGladys(discoveredDevices) {
  console.log("START MAPPING DISCOVERED DEVICES WITH GLADYS");

  let unknownDevices = [];

  for (let d in discoveredDevices) {

    const device = discoveredDevices[d];
    const deviceId = `${SERVICE_SELECTOR}:${device.id}`;
    
    // if Gladys already knows this device
    const alreadyInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);

    if (alreadyInGladys) {

      // check if we mapped it yet
      console.debug(device.id + ' is already in Gladys !');
      const notMappedYet = this.deviceIpByMacAdress.get(device.id) === undefined;

      if (notMappedYet) {    

        console.debug(device.id + ' is now mapped with the service !');
        this.devices[device.id] = alreadyInGladys;
        this.deviceIpByMacAdress.set(device.id, device.address);

      }
    } else {
      console.debug('new device detected: ' + device.id + ' - ' + device.address);
      unknownDevices.push(device);
    }
  }
  return unknownDevices;
}

module.exports = {
  mapKnownDevicesWithGladys,
};
