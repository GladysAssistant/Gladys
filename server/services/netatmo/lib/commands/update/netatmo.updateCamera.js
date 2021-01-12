const axios = require('axios');
const sharp = require('sharp');
const btoa = require('btoa');
const logger = require('../../../../../utils/logger');
const { EVENTS } = require('../../../../../utils/constants');
const { NETATMO_VALUES } = require('../../constants');
const { getDeviceFeatureBySelector } = require('../../../../../utils/device');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @example
 * updateCamera();
 */
async function updateCamera(key, device, deviceSelector) {
  // we process the data from the cameras
  if (this.devices[key].type === 'NACamera' || this.devices[key].type === 'NOC') {
    const externalIdCamera = `netatmo:${this.devices[key].id}`;
    const selectorCamera = externalIdCamera.replace(/:/gi, '-');
    try {
      const responseImage = await axios.get(`${this.devices[key].vpn_url}/live/snapshot_720.jpg`, {
        responseType: 'arraybuffer',
      });
      const sharpData = await sharp(responseImage.data)
        .rotate()
        .resize(400)
        .toBuffer();
      const b64encoded = btoa(
        [].reduce.call(
          new Uint8Array(sharpData),
          function(p, c) {
            return p + String.fromCharCode(c);
          },
          '',
        ),
      );
      const mimetype = 'image/jpeg';
      const base64image = `data:${mimetype};base64,${b64encoded}`;
      this.gladys.device.camera.setImage(selectorCamera, base64image);

      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:power`,
        state: NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].alim_status.toUpperCase()],
      });
      const powerValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].alim_status.toUpperCase()];
      let feature = getDeviceFeatureBySelector(device, `${deviceSelector}-power`);
      if (feature.last_value !== powerValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:power`,
          state: powerValue,
        });
      }
      if (this.devices[key].type === 'NACamera') {
        this.devices[key].modules.forEach((module) => {
          const sidModule = module.id;
          const moduleExternalId = `netatmo:${sidModule}`;
          const moduleSelector = moduleExternalId.replace(/:/gi, '-');
          const deviceModule = this.gladys.device.getBySelector(moduleSelector);
          try {
            // we save the common data of home coaches and weather stations
            if (this.devices[sidModule].type === 'NIS' || this.devices[sidModule].type === 'NACamDoorTag') {
              const batteryValue = this.devices[sidModule].battery_percent;
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-battery`);
              if (feature.last_value !== batteryValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: batteryValue,
                });
              }
            }
          } catch (e) {
            logger.error(`Netatmo : File netatmo.poll.js - Sirene or DoorTag - error : ${e}`);
          }
          try {
            // we save other indoor sirens data
            if (this.devices[sidModule].type === 'NIS') {
              const sirenValue = NETATMO_VALUES.SECURITY.SIREN[this.devices[sidModule].status.toUpperCase()];
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-siren`);
              if (feature.last_value !== sirenValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:siren`,
                  state: sirenValue,
                });
              }
            }
          } catch (e) {
            logger.error(`Netatmo : File netatmo.poll.js - Sirene - error : ${e}`);
          }
          try {
            // we save other interior door / window opening detectors data
            if (this.devices[sidModule].type === 'NACamDoorTag') {
              const doorTagValue = NETATMO_VALUES.SECURITY.DOOR_TAG[this.devices[sidModule].status.toUpperCase()];
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-doortag`);
              if (feature.last_value !== doorTagValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:doorTag`,
                  state: doorTagValue,
                });
              }
            }
          } catch (e) {
            logger.error(`Netatmo : File netatmo.poll.js - DoorTag - error : ${e}`);
          }
        });
      }
      if (this.devices[key].type === 'NOC') {
        const lightValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].light_mode_status.toUpperCase()];
        const sirenValue = NETATMO_VALUES.SECURITY.SIREN[this.devices[key].siren_status.toUpperCase()];
        feature = getDeviceFeatureBySelector(device, `${deviceSelector}-light`);
        if (feature.last_value !== lightValue) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${key}:light`,
            state: lightValue,
          });
        }
        feature = getDeviceFeatureBySelector(device, `${deviceSelector}-siren`);
        if (feature.last_value !== sirenValue) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${key}:siren`,
            state: sirenValue,
          });
        }
      }
    } catch (e) {
      logger.error(`Netatmo : File netatmo.poll.js - Camera - error : ${e}`);
    }
  }
}

module.exports = {
  updateCamera,
};
