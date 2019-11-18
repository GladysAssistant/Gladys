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
  discovery.scan(5000).then(async devices => {

    console.debug(devices.length + ' Magic Device(s) found while scanning !');

    for (let d in devices) {

      const device = devices[d];
      const deviceId = `${SERVICE_SELECTOR}:${device.id}`;
      
      // if Gladys already knows this device
      const alreadyInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
      if (alreadyInGladys) {
        // check if we mapped it yet
        console.debug(device.id + ' is already in Gladys !');
        const notMappedYet = this.deviceIpByMacAdress.get(device.id) === undefined;
        if (notMappedYet) {          
          console.debug(device.id + ' is now mapped with the service !');
          this.deviceIpByMacAdress.set(device.id, device.address);
        }
        // skip the creation of the device in Gladys
        continue;
      }

      // il fat ajouter this.devices

      // check if we mapped it yet
      const doesntExistYet = this.devices[device.id] === undefined;

      if (doesntExistYet) {

        console.debug(device.id + ' is new ! Creating it in Gladys');

        const powerFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.POWER}`;
        const colorFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`;
        
        const hueFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.HUE}`;
        const saturationFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.SATURATION}`;
        const brightnessFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`;
        const temperatureFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`;

        console.log('\tCreating Device with id ' + deviceId);

        const deviceCreated = await this.gladys.device.create({
          name: device.model,
          service_id: this.serviceId,
          external_id: deviceId,
          selector: deviceId,
          model: device.model,
          should_poll: true,
          poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
          features: [
            {
              name: "On/Off",              
              read_only: false,              
              keep_history: false,
              has_feedback: false,
              external_id: powerFeatureId,
              selector: powerFeatureId,
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
              name: "Hue",              
              read_only: false,
              keep_history: false,
              has_feedback: false,
              external_id: hueFeatureId,
              selector: hueFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.HUE,
              min: 0,
              max: 359
            },
            {
              name: "Saturation",              
              read_only: false,
              keep_history: false,
              has_feedback: false,
              external_id: saturationFeatureId,
              selector: saturationFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
              min: 0,
              max: 100
            },
            {
              name: "Brightness / Lightness / Value",   
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
            {
              name: "Temperature / Warm White",
              read_only: false,
              keep_history: false,
              has_feedback: false,
              external_id: temperatureFeatureId,
              selector: temperatureFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
              min: 0,
              max: 255
            },
          ],
          params: [],
        });
        
        this.deviceIpByMacAdress.set(device.id, device.address);

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
