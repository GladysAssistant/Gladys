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

    console.log(devices.length + ' Magic Device(s) found !');

    for (let d in devices) {

      const netDevice = devices[d];

      // device and features ids
      const deviceId = `${SERVICE_SELECTOR}:${netDevice.id}`;
      const powerFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.POWER}`;
      const colorFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`;
      const brightnessFeatureId = `${deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`;

      // should use gladys state devices ... ?
      const doesntExistYet = this.devices[netDevice.id] === undefined;

      if (doesntExistYet) {

        console.log('\tCreating Device with id ' + deviceId);

        const deviceCreated = await this.gladys.device.create({
          name: netDevice.model,
          service_id: this.serviceId,
          external_id: deviceId,
          selector: deviceId,
          model: netDevice.model,
          should_poll: true,
          poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS,
          features: [
            {
              name: "On/Off",              
              read_only: false,
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
              has_feedback: false,
              external_id: colorFeatureId,
              selector: colorFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
              min: 0,
              max: 0
            },
            {
              name: "Brightness",              
              read_only: false,
              has_feedback: false,
              external_id: brightnessFeatureId,
              selector: brightnessFeatureId,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
              min: 0,
              max: 255
            },
          ],
          params: [],
        });
        
        this.deviceIpByMacAdress.set(netDevice.id, netDevice.address);
        // this.addDevice(netDevice.id, device);
        // this.getStatus(deviceCreated);
      }

    };
  });
}

module.exports = {
  scan,
};
