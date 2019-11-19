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

/**
 * @description Send a broadcast to find the devices
 * @example
 * magicDevices.scan();
 */
function scan() {

  let discovery = new Discovery();
  discovery.scan(5000).then(async discoveredDevices => {

    console.debug(discoveredDevices.length + ' Magic Device(s) found while scanning !');

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
        // skip the creation of the device in Gladys
        continue;
      }

      // il faUt ajouter this.devices

      // check if we mapped it yet
      const doesntExistYet = this.devices[device.id] === undefined;

      if (doesntExistYet) {

        console.debug(device.id + ' is new ! Creating it in Gladys');

        const binaryFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`;
        const colorFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`;        
        const warmWhiteFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`;
        const brightnessFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`;

        console.log('\tCreating Device with id ' + deviceId);

        const deviceCreated = await this.gladys.device.create({
          name: device.model,
          service_id: this.serviceId,
          external_id: deviceId,
          selector: deviceId,
          model: device.model,
          should_poll: true,
          poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS,
          features: [
            {
              name: "On/Off",              
              read_only: false,              
              keep_history: false,
              has_feedback: false,
              external_id: binaryFeatureId,
              selector: binaryFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
              min: 0,
              max: 1
            },
            {
              name: "Color",
              read_only: false,
              keep_history: false,
              has_feedback: false,
              external_id: colorFeatureId,
              selector: colorFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
              min: 0,
              max: 0
            },
            {
              name: "Warm White",
              read_only: false,
              keep_history: false,
              has_feedback: false,
              external_id: warmWhiteFeatureId,
              selector: warmWhiteFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
              min: 0,
              max: 255
            },            
            {
              name: "Brightness",
              read_only: false,
              keep_history: false,
              has_feedback: false,
              external_id: brightnessFeatureId,
              selector: brightnessFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
              min: 0,
              max: 100
            },
          ],
          params: [],
        });
        
        this.deviceIpByMacAdress.set(device.id, device.address);
        this.devices[device.id] = device;
        this.gladys.event.emit(EVENTS.DEVICE.NEW, deviceCreated);
        // this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        //   type: WEBSOCKET_MESSAGE_TYPES.MAGIC_DEVICES.NEW_DEVICE,
        //   payload: deviceCreated,
        // });

        // this.addDevice(netDevice.id, device);
        // this.getStatus(deviceCreated);
      }

    };
  });
}

module.exports = {
  scan,
};
