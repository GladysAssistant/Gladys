const axios = require('axios');
const sharp = require('sharp');
const btoa = require('btoa');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');
const { NETATMO_VALUES } = require('../constants');

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

  try {
    let feature;
    if (device !== undefined) {
      try {
        const externalIdCamera = `netatmo:${this.devices[key].id}`;
        const selectorCamera = externalIdCamera.replace(/:/gi, '-');
        const responseImage = await axios.get(`${this.devices[key].vpn_url}/live/snapshot_720.jpg`, {
          responseType: 'arraybuffer',
        });
        const sharpData = await sharp(responseImage.data)
          .rotate()
          .resize(300)
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
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateCamera.js - Camera ${this.devices[key].type} ${this.devices[key].name} - vpn_url - error : ${e}`,
        );
      }
      try {
        const powerValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].alim_status.toUpperCase()];
        feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-power`);
        if (parseInt(feature.last_value, 16) !== parseInt(powerValue, 16)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${key}:power`,
            state: powerValue,
          });
        } else {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
            device_feature_external_id: `netatmo:${key}:power`,
          });
        }
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateCamera.js - Camera ${this.devices[key].type} ${this.devices[key].name} - power - error : ${e}`,
        );
      }
      try {
        if (this.devices[key].type === 'NOC') {
          const lightValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].light_mode_status.toUpperCase()];
          const sirenValue = NETATMO_VALUES.SECURITY.SIREN[this.devices[key].siren_status.toUpperCase()];
          try {
            feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-light`);
            if (parseInt(feature.last_value, 16) !== lightValue) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${key}:light`,
                state: lightValue,
              });
            } else {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
                device_feature_external_id: `netatmo:${key}:light`,
              });
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Camera NOC ${this.devices[key].name} - light - error : ${e}`,
            );
          }
          try {
            feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-siren`);
            if (parseInt(feature.last_value, 16) !== sirenValue) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${key}:siren`,
                state: sirenValue,
              });
            } else {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
                device_feature_external_id: `netatmo:${key}:siren`,
              });
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Camera NOC ${this.devices[key].name} - siren - error : ${e}`,
            );
          }
        }
      } catch (e) {
        logger.error(`Netatmo : File netatmo.updateCamera.js - Camera NOC ${this.devices[key].name} - error : ${e}`);
      }
    }
    if (this.devices[key].type === 'NACamera') {
      this.devices[key].modules.forEach(async (module) => {
        const sidModule = module.id;
        const moduleExternalId = `netatmo:${sidModule}`;
        const moduleSelector = moduleExternalId.replace(/:/gi, '-');
        let deviceModule;
        try {
          deviceModule = await this.gladys.device.getBySelector(moduleSelector);
          try {
            // we save the common data of home coaches and weather stations
            if (module.type === 'NIS' || module.type === 'NACamDoorTag') {
              const batteryValue = module.battery_percent;
              feature = await getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-battery`);
              if (parseFloat(feature.last_value) !== parseFloat(batteryValue)) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: batteryValue,
                });
              } else {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                });
              }
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Module NACamera ${module.type} ${module.name} - battery percent value - error : ${e}`,
            );
          }
          try {
            // we save other indoor sirens data
            if (module.type === 'NIS') {
              const sirenValue = NETATMO_VALUES.SECURITY.SIREN[module.status.toUpperCase()];
              feature = await getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-siren`);
              if (parseInt(feature.last_value, 16) !== parseInt(sirenValue, 16)) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:siren`,
                  state: sirenValue,
                });
              } else {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
                  device_feature_external_id: `netatmo:${sidModule}:siren`,
                });
              }
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Module NACamera ${module.name} - state - error : ${e}`,
            );
          }
          try {
            // we save other interior door / window opening detectors data
            if (module.type === 'NACamDoorTag') {
              const doorTagValue = NETATMO_VALUES.SECURITY.DOOR_TAG[module.status.toUpperCase()];
              feature = await getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-doortag`);
              if (parseInt(feature.last_value, 16) !== parseInt(doorTagValue, 16)) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:doorTag`,
                  state: doorTagValue,
                });
              } else {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
                  device_feature_external_id: `netatmo:${sidModule}:doorTag`,
                });
              }
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Module NACamera ${module.name} - state - error : ${e}`,
            );
          }
        } catch (e) {
          logger.debug(
            `Netatmo : File netatmo.updateCamera.js - device netatmo ${module.type ? module.type : '"type"'} ${
              module.name
            } no save in DB - error : ${e}`,
          );
        }
      });
    }
  } catch (e) {
    logger.error(
      `Netatmo : File netatmo.updateCamera.js - Camera ${this.devices[key].type ? this.devices[key].type : '"type"'} ${
        this.devices[key].name
      } - error : ${e}`,
    );
  }
}

module.exports = {
  updateCamera,
};
